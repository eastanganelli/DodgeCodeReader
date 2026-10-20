# User guide

*[Leer en español](guia-de-usuario.md)*

Dodge Code Reader reads the trouble codes stored in your Dodge, Chrysler, Jeep or Plymouth
engine computer by **watching the check-engine light blink in a video**. You don't need
a scanner, cables or special tools – only a phone or computer.

It works on most 1990s Chrysler-group vehicles that show codes by blinking the
check-engine lamp (for example a 1994 Dodge Dakota).

---

## 1. Open the app

Go to **https://eastanganelli.github.io/DodgeCodeReader/** in Chrome, Edge, Safari or Firefox.

**Install it (optional, recommended).** Once installed it opens like a normal app and
works without internet.

| Device | How to install |
|---|---|
| Android (Chrome) | Menu **⋮ → Install app** (or *Add to Home screen*) |
| iPhone / iPad (Safari) | **Share** button **→ Add to Home Screen** |
| Windows / Mac / Linux (Chrome, Edge) | Install icon in the address bar, or menu **→ Install Dodge Code Reader** |

## 2. Adjust the screen to you

At the top of every screen:

- **A A A** – three text sizes. Pick the one that is comfortable to read.
- **ES / EN** – Spanish or English.
- **☀ / ☾** – light or dark colors. Light is easier in daylight, dark at night.

The app remembers your choice.

## 3. Get the truck ready

1. Sit in the driver's seat. **Engine OFF.**
2. Turn the key **ON – OFF – ON – OFF – ON**, all within about 5 seconds.
   Stop at **ON**. **Do not start the engine.**
3. Watch the check-engine light. It starts blinking in groups: that is the code list.
   It ends with **5 blinks, pause, 5 blinks** (code 55).

> **Tip:** if you missed the start, turn the key OFF and do the ON–OFF sequence again.

## 4. Record the light

Tap **Record video** (opens the camera) or **Choose a video** (pick one you already have).

For a good reading:

- Start recording **before** the last key turn to ON, so the first blink is captured.
- Keep recording until the light stops blinking (about 1 minute). Make sure you see
  the **55** at the end.
- Hold the phone **steady**. Rest it on the steering wheel or use a holder.
- Get **close**: the light should be clearly visible, not a tiny dot.
- Avoid sunlight hitting the dashboard and reflections on the glass. Shade helps.
- Any normal video works (MP4, MOV, WebM). 30 frames per second or more is best.

## 5. Find the light (step 1 of 3)

The app scans the video and puts a **yellow box** on the light that blinks.

- If the box is on the check-engine light → tap **Yes, read the codes**.
- If it is on something else → **tap the check-engine light** in the video to move the box,
  or **drag** to draw a new box around it.
- If it says it could not find a blinking light → tap the light yourself.

**Search again** repeats the automatic search. **Use another video** goes back.

### Advanced settings (optional)

Most people never need these. Open **Advanced settings** if the reading is wrong:

| Setting | When to change it |
|---|---|
| **Start at / End at** | The video has a long part before or after the blinking. Trim it. |
| **Automatic sensitivity** | Leave ON. Turn OFF only if the light is very dim, then move **Sensitivity threshold** until it works. |
| **Max gap inside a digit** | Two digits are being joined into one (e.g. 4 and 3 read as 7). Lower it. |
| **Min gap between codes** | Two codes are being joined or one code is split. Adjust in small steps. |

## 6. Reading (step 2 of 3)

Keep the screen open while it works. You see:

- A progress bar.
- **Blinks** – how many flashes were counted.
- **Counting** – the digit being counted right now.
- Codes appear at the bottom as they are found.
- The yellow box glows each time the light is ON.

**Cancel** stops and returns to the previous step.

## 7. Your results (step 3 of 3)

Each active code appears as a card, the most important first:

| Color and label | Meaning |
|---|---|
| 🔴 **Lamp ON – check soon** | The engine computer turns on the check-engine light for this problem. Have it checked. |
| 🟠 **Lamp may not stay on** | A real fault, but the light may not stay on all the time. |
| ⚪ **No lamp** / **Information – normal** | Minor or informational. Code **12** only means the battery was disconnected recently – it is normal. |
| 🔵 **Unknown code** | Not in the list. Probably misread – try another video. |

Every card shows:

- **The code number** and a short plain-language title.
- **Seen N times** – how many times the code blinked in your video. The computer usually
  repeats the list, so 2 or more is normal.
- **Technical details** – tap to open the full description.

Special messages:

- **Good news: no faults found** – only code 55 (end of list) blinked.
- **Code 55 was not seen** – the video probably stopped too early. The list may be
  missing codes. Record again and keep going until the end.
- **No codes could be read** – the blinking wasn't clear. See *Problems* below.

Buttons:

- **Share** – send the report by WhatsApp, email, etc. (on computers it copies it).
- **Copy** – copy the report as text.
- **Print** – print it or save as PDF.
- **Read another video** – start over.

At the bottom, **Codes in the order they blinked** shows the raw sequence, and
**Light signal (for experts)** shows a brightness chart.

## 8. Previous readings

The home screen lists your last 10 readings with their date and codes. Tap one to see
its full results again. **Clear** deletes them. They are stored only on your device.

## Problems

| Problem | What to try |
|---|---|
| Box is not on the light | Tap the light. Or drag a box around it. |
| "No codes could be read" | Record closer, steadier, out of direct sun. Check the box is on the right light. |
| Wrong numbers (e.g. 7 instead of 43) | Advanced settings → lower **Max gap inside a digit** a little. |
| Code 55 missing | Record until the light stops blinking. |
| Strange codes (blue "Unknown") | Read another video. Compare both results. |
| Camera does not open | Allow camera access for the site in your browser settings. Or use **Choose a video**. |
| Slow on old phones | Trim the video with **Start at / End at**. |

## Privacy

Everything happens on your device. **Your video is never uploaded.** History and
settings are saved in your browser only.

## Important

This app helps you understand what the engine computer reports. It is not a full
diagnosis. A code tells you which circuit or sensor reported a problem, not always
which part has failed. **Ask a mechanic before replacing parts.**

See the full list in the [fault code reference](fault-codes.md).
