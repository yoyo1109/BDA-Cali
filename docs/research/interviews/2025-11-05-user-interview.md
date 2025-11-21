# Interview: <Driver Workflow & Data Entry Validation>

- **Date:** <2025-11-05>
- **Interviewer(s):** <Allan>
- **Participant ID:** <01>
- **Role/Segment:** <Driver | Admin>


## Objectives
Decision: Determine the mandatory fields for the "Pickup Complete" screen in the mobile app.

Hypothesis: Drivers need a faster way to capture receipts and weights than manually typing everything while standing at a donor's loading dock.

Goal: Understand how drivers currently balance using the app vs. external navigation tools (Google Maps/Waze).

## Context
Environment: The participant interacts with the app in their vehicle and standing at donor loading docks.

Workflow: Allan (Admin) assigns requests/routes; the Driver executes the pickup and reports back data.

Current State: Driver is handling a mix of perishables and dry goods.

## Script / Flow
1. Warm-up & Cargo Types

Q: "On a normal day, what kinds of donations do you pick up, and how are they usually packaged?"

Observation: The driver deals with a mix of durability. Most items are shelf-stable (cans/dry goods), but they also handle perishables (produce/bakery) which adds time pressure.

Packaging: Usually boxes or bags. Pallets occur occasionally, which requires different handling.

2. Data Entry at Pickup

Q: "At the pickup site, what details do you currently write down or capture?"

Observation: The driver currently captures Weight, Category, Donor Name, and Date/Time.

Validation: Proof of pickup is critical. They prefer taking a photo of a receipt and getting a signature. However, if a signature isn't possible, they need a way to add a note explaining why.

3. Routing & Scheduling

Q: "How do you choose where to go first? How do you confirm the pickup time and location?"

Observation: The driver checks the assignment list sent by Allan in the app first.

Navigation: They rely heavily on third-party apps (Google Maps/Waze) for actual traffic data. They will follow the app's optimized route if provided, but they verify it against current traffic conditions.


## Quotes
“Mostly shelf-stable items like cans and dry goods, plus some produce. It’s usually boxes or bags; occasionally pallets. Perishables are time-sensitive, so I have to move fast.”

“I need to record the weight and general category. If possible, I snap a receipt photo and get a donor signature; otherwise, I leave a note explaining why I couldn't.”

“I check my assigned pickups in the app first. If the app suggests an optimized route, I generally follow that, but I use Google Maps or Waze to actually navigate.”

## Pain Points / Frictions
Pain Points / Frictions
Time Sensitivity: Perishables (produce/dairy) create anxiety about speed; complex data entry forms slow the driver down.

Signature Friction: Sometimes donors are busy or unavailable to sign, forcing the driver to find a workaround or leave a note.

App Switching: The driver has to toggle between the Donation App (for the address) and Waze (for navigation), which is dangerous or annoying while driving.

## Opportunities / Ideas
Quick-Capture Mode: Allow the driver to take a photo of the items/receipt first and fill in the weight/category later when safe in the truck.

"No Signature" Button: Add a quick toggle for "Donor Unavailable" that automatically prompts for a text note, rather than making the driver search for how to skip the signature.

Deep Linking: Add a "Navigate" button that automatically opens the specific address in Waze/Google Maps to reduce copy-pasting.

## Summary
The driver generally follows the route assignments sent by Admin but validates them with their own traffic tools. The stressor is the time sensitivity of perishable goods. Regarding data entry, Weight and Category are the non-negotiables. There is a strong desire to use photos (receipts) to validate pickups rather than manual text entry, and they need flexibility when a donor signature cannot be obtained.

## Next Actions
Review the "Pickup Complete" screen mockups to ensure "Weight" and "Photo Upload" are the most prominent features.

Create a user flow for "Skip Signature" to see if it reduces driver idle time at the dock.

- Screenshots or attachments: docs/research/interviews/<assets>
- Recording link (do not store raw media in repo): <URL>
