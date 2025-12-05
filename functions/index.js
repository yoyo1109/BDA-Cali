const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { defineSecret } = require('firebase-functions/params');

// Define OpenAI API key as a secret
const openaiApiKey = defineSecret('OPENAI_API_KEY');

admin.initializeApp();

/**
 * Cloud Function: Process receipt image with GPT-4 Vision
 * Triggered via HTTPS call from React Native app
 *
 * Input: { receiptImageUrl: string }
 * Output: { success: boolean, items: PickupItem[], overallConfidence: number, rawText: string }
 *
 * Uses OpenAI GPT-4 Vision to intelligently parse receipt tables
 * and extract structured donation item data.
 */
exports.processReceiptOCR = functions.https.onCall({
  timeoutSeconds: 60,
  memory: '512MiB',
  secrets: [openaiApiKey]
}, async (request) => {
  const data = request.data;

  // Authentication check
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to process receipts'
    );
  }

  const { receiptImageUrl } = data;

  if (!receiptImageUrl) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Receipt image URL is required'
    );
  }

  try {
    // Step 1: Call OpenAI GPT-4 Vision API
    console.log('[OCR] Processing receipt with GPT-4 Vision:', receiptImageUrl);

    const apiKey = openaiApiKey.value().trim();
    console.log('[OCR] API key exists:', !!apiKey);
    console.log('[OCR] API key length:', apiKey ? apiKey.length : 0);
    console.log('[OCR] API key starts with:', apiKey ? apiKey.substring(0, 10) : 'N/A');

    if (!apiKey) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'OpenAI API key not configured. Please set OPENAI_API_KEY secret.'
      );
    }

    const prompt = `Analyze this food donation receipt image.

INSTRUCTIONS:
1. IGNORE the header, store name, address, phone numbers, and zip codes.
2. Look for a TABLE structure with columns like "QTY", "DESCRIPTION", "ITEM", and "VALUE" or "PRICE".
3. Extract items row by row from the table.
4. For each item, identify:
   - Quantity (number of units)
   - Description/Name
   - Unit price or total value
   - Food category (produce, dairy, bakery, canned_goods, dry_goods, meat, frozen, or other)
5. Ignore subtotals, tax, and payment information.

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "items": [
    {
      "description": "item name",
      "category": "produce|dairy|bakery|canned_goods|dry_goods|meat|frozen|other",
      "quantity": 2,
      "unitPrice": 5.99,
      "totalValue": 11.98
    }
  ],
  "overallConfidence": 0.95
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: receiptImageUrl } }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[OCR] OpenAI API error:', response.status, errorData);
      throw new functions.https.HttpsError(
        'internal',
        `OpenAI API error: ${response.status}`
      );
    }

    const data = await response.json();
    console.log('[OCR] GPT-4 Vision response:', JSON.stringify(data.choices[0].message.content));

    // Parse GPT-4 Vision response
    const content = data.choices[0].message.content;
    let parsedData;

    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      parsedData = JSON.parse(jsonMatch[1]);
    } catch (parseError) {
      console.error('[OCR] Failed to parse GPT response:', content);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to parse receipt data. Please try again or enter manually.'
      );
    }

    console.log('[OCR] Parsed', parsedData.items.length, 'items');

    // Step 2: Map to PickupItem structure
    const pickupItems = parsedData.items.map(item => ({
      id: admin.firestore().collection('_').doc().id,
      category: item.category,
      packaging: [{
        type: inferPackagingType(item.description, item.quantity),
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice.toFixed(2))
      }],
      totalWeight: String((item.quantity * 2.2).toFixed(2)), // Estimate: 2.2 lbs per unit
      totalValue: String(item.totalValue.toFixed(2)),
      confidence: parsedData.overallConfidence || 0.90,
      rawText: item.description
    }));

    return {
      success: true,
      items: pickupItems,
      overallConfidence: parsedData.overallConfidence || 0.90,
      rawText: JSON.stringify(parsedData.items),
      itemCount: pickupItems.length
    };

  } catch (error) {
    console.error('[OCR] Processing error:', error);
    console.error('[OCR] Error message:', error.message);
    console.error('[OCR] Error stack:', error.stack);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      `Failed to process receipt: ${error.message}. Please try again or enter items manually.`,
      error.stack
    );
  }
});

/**
 * Infer packaging type based on item name and quantity
 */
function inferPackagingType(itemName, quantity) {
  const normalized = itemName.toLowerCase();

  // Look for packaging hints in item name
  if (normalized.includes('caja') || normalized.includes('box')) {
    return 'Boxes';
  }
  if (normalized.includes('bolsa') || normalized.includes('bag') || normalized.includes('saco')) {
    return 'Bags';
  }
  if (normalized.includes('pallet') || normalized.includes('estiba') || quantity > 20) {
    return 'Pallets';
  }

  // Default based on quantity
  return quantity <= 5 ? 'Boxes' : 'Bags';
}
