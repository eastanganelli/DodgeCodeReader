# Fault code reference

> Generated from [`src/data/codes.ts`](../src/data/codes.ts) by `npm run docs:codes`. Do not edit by hand.

Flash codes for 1990s Chrysler/Dodge SBEC engine computers (PCM), read from the check-engine lamp.

**Lamp column**

- `**` **Lamp ON** – the check-engine lamp lights while the engine runs if this code was recorded. Shown in red in the app.
- `*` **Intermittent** – the lamp will not stay lit at all times for this code. Shown in amber.
- **—** – no lamp marker in the reference list. Shown in grey.
- **info** – normal / informational, not a fault (`12`, `55`).

Code **55** marks the end of the list. If it is the only code, no faults are stored.

| Code | Lamp | Title | Description | Título (ES) |
|---:|---|---|---|---|
| **11** | `**` Lamp ON | Engine timing / position sensor | Timing belt skipped 1 tooth or more from initial learned value, Intermittent loss of either camshaft or crankshaft position sensor, No crank reference signal detected during engine cranking | Sincronización / sensor de posición |
| **12** | `*` Intermittent · info | Battery was disconnected (normal) | Direct battery input to PCM was disconnected within the last 50 key-on cycles (normal) | Batería desconectada (normal) |
| **13** | `**` Lamp ON | MAP sensor not changing | No change in MAP output voltage from start to run | Sensor MAP sin variación |
| **14** | `**` Lamp ON | MAP sensor voltage out of range | MAP sensor output voltage outside the acceptable range (too low or too high) | Voltaje del sensor MAP fuera de rango |
| **15** | `**` Lamp ON | No vehicle speed signal | No vehicle speed sensor signal | Sin señal de velocidad |
| **17** | `*` Intermittent | Engine running too cold | Closed loop temp not reached or engine cold too long | Motor demasiado frío |
| **21** | `**` Lamp ON | Oxygen (O2) sensor stuck | 02s sensor does not detect rich or lean condition (signal stays at center) | Sensor de oxígeno (O2) trabado |
| **22** | `**` Lamp ON | Coolant temperature sensor | Engine coolant temp sensor signal outside the acceptable range | Sensor de temperatura de refrigerante |
| **23** | `**` Lamp ON | Intake air temperature sensor | Intake air temp sensor signal outside acceptable range | Sensor de temperatura de aire de admisión |
| **24** | `**` Lamp ON | Throttle position sensor | Throttle Position sensor signal outside acceptable range | Sensor de posición del acelerador (TPS) |
| **25** | `**` Lamp ON | Idle air control motor | Idle air control motor circuit short or open condition detected | Motor de control de ralentí (IAC) |
| **27** | `*` Intermittent | Fuel injector circuit | Injector control circuit failure | Circuito de inyectores |
| **31** | `**` Lamp ON | Evap (purge) solenoid circuit | Evap Solenoid circuit short or open condition detected | Circuito del solenoide EVAP (purga) |
| **32** | `**` Lamp ON | EGR solenoid circuit | EGR Solenoid circuit short or open condition detected | Circuito del solenoide EGR |
| **33** | `*` Intermittent | A/C clutch relay circuit | A/C clutch relay circuit short or open condition detected | Circuito del relé del embrague de A/A |
| **34** | `*` Intermittent | Cruise (speed) control | Speed control vacuum or vent circuit short or open condition detected OR speed control switch input outside accepted range | Control de velocidad crucero |
| **35** | — | Radiator fan relay circuit | Rad Fan control relay circuit short or open condition detected (4 cyl only) | Circuito del relé del electroventilador |
| **37** | `*` Intermittent | Torque converter / transmission | Torque converter clutch solenoid CKT or park/neutral switch failure OR Transmission Temperature sensor to high, which is specific to Ram PCM 94-up Dakotas don't have the transmission temperature sensor. | Convertidor de par / transmisión |
| **41** | `**` Lamp ON | Alternator field not switching | Generator field not switching properly | Campo del alternador no conmuta |
| **42** | `*` Intermittent | Fuel pump / ASD relay / fuel level | Fuel pump relay control ckt, Auto shutdown relay control ckt, No ASD relay output voltage at PCM, Fuel level sending unit volts out of range, Fuel level unit No change over miles | Bomba de combustible / relé ASD / nivel |
| **43** | `**` Lamp ON | Engine misfire | Multiple/ single cylinder misfire | Falla de encendido (misfire) |
| **44** | `*` Intermittent | Battery temperature sensor | Battery temp sensor volts out of accepted range | Sensor de temperatura de batería |
| **45** | `*` Intermittent | Overdrive solenoid circuit | Transmission OD solenoid circuit short or open condition detected | Circuito del solenoide de overdrive |
| **46** | `**` Lamp ON | Charging voltage too high | Charging system voltage too high | Voltaje de carga muy alto |
| **47** | `**` Lamp ON | Charging voltage too low | Charging system voltage too low | Voltaje de carga muy bajo |
| **51** | `**` Lamp ON | Fuel mixture too lean | Fuel system lean | Mezcla pobre |
| **52** | `**` Lamp ON | Fuel mixture too rich | Fuel system rich | Mezcla rica |
| **53** | `*` Intermittent | Engine computer (PCM) failure | Internal PCM failure | Falla interna de la computadora (PCM) |
| **54** | `*` Intermittent | No camshaft signal | No cam signal at PCM | Sin señal de árbol de levas |
| **55** | `*` Intermittent · info | End of codes | End of error messages (If you get this only, no errors were found) | Fin de códigos |
| **62** | `*` Intermittent | PCM failure – service mileage not stored | PCM failure SRI mile not stored | Falla PCM – km de servicio no guardados |
| **63** | `*` Intermittent | PCM failure – memory write denied | PCM Failure EEPROM write denied | Falla PCM – escritura de memoria denegada |
| **64** | `**` Lamp ON | Catalytic converter efficiency | Catalytic Converter Efficiency Failure | Eficiencia del catalizador |
| **65** | — | Power steering switch | Power steering switch failure | Interruptor de dirección hidráulica |

Total: 34 codes.
