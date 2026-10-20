/**
 * Chrysler / Dodge flash (blink) fault codes, read from the check-engine lamp
 * by cycling the key ON-OFF-ON-OFF-ON.
 *
 * lamp:
 *  - 'on'           (**) Check-engine lamp illuminates while the engine runs if recorded.
 *  - 'intermittent' (*)  Lamp will not illuminate at all times if recorded.
 *  - 'none'              No lamp marker in the reference list.
 */
export type LampBehavior = 'on' | 'intermittent' | 'none';

export interface FaultCode {
  code: number;
  lamp: LampBehavior;
  /** Short plain-language title */
  title: { en: string; es: string };
  /** Full technical description */
  description: { en: string; es: string };
  /** Informational codes are normal / not a fault */
  informational?: boolean;
}

export const END_OF_CODES = 55;

export const FAULT_CODES: FaultCode[] = [
  {
    code: 11, lamp: 'on',
    title: { en: 'Engine timing / position sensor', es: 'Sincronización / sensor de posición' },
    description: {
      en: 'Timing belt skipped 1 tooth or more from initial learned value, Intermittent loss of either camshaft or crankshaft position sensor, No crank reference signal detected during engine cranking',
      es: 'Correa de distribución saltó 1 diente o más respecto del valor aprendido, pérdida intermitente del sensor de posición de árbol de levas o cigüeñal, no se detectó señal de referencia del cigüeñal durante el arranque',
    },
  },
  {
    code: 12, lamp: 'intermittent', informational: true,
    title: { en: 'Battery was disconnected (normal)', es: 'Batería desconectada (normal)' },
    description: {
      en: 'Direct battery input to PCM was disconnected within the last 50 key-on cycles (normal)',
      es: 'La alimentación directa de batería a la PCM se desconectó en los últimos 50 ciclos de llave (normal)',
    },
  },
  {
    code: 13, lamp: 'on',
    title: { en: 'MAP sensor not changing', es: 'Sensor MAP sin variación' },
    description: {
      en: 'No change in MAP output voltage from start to run',
      es: 'Sin cambio en el voltaje de salida del MAP entre arranque y marcha',
    },
  },
  {
    code: 14, lamp: 'on',
    title: { en: 'MAP sensor voltage out of range', es: 'Voltaje del sensor MAP fuera de rango' },
    description: {
      en: 'MAP sensor output voltage outside the acceptable range (too low or too high)',
      es: 'Voltaje de salida del sensor MAP fuera del rango aceptable (muy bajo o muy alto)',
    },
  },
  {
    code: 15, lamp: 'on',
    title: { en: 'No vehicle speed signal', es: 'Sin señal de velocidad' },
    description: { en: 'No vehicle speed sensor signal', es: 'Sin señal del sensor de velocidad del vehículo' },
  },
  {
    code: 17, lamp: 'intermittent',
    title: { en: 'Engine running too cold', es: 'Motor demasiado frío' },
    description: {
      en: 'Closed loop temp not reached or engine cold too long',
      es: 'No se alcanzó la temperatura de lazo cerrado o el motor estuvo frío demasiado tiempo',
    },
  },
  {
    code: 21, lamp: 'on',
    title: { en: 'Oxygen (O2) sensor stuck', es: 'Sensor de oxígeno (O2) trabado' },
    description: {
      en: '02s sensor does not detect rich or lean condition (signal stays at center)',
      es: 'El sensor O2 no detecta condición rica ni pobre (la señal queda en el centro)',
    },
  },
  {
    code: 22, lamp: 'on',
    title: { en: 'Coolant temperature sensor', es: 'Sensor de temperatura de refrigerante' },
    description: {
      en: 'Engine coolant temp sensor signal outside the acceptable range',
      es: 'Señal del sensor de temperatura de refrigerante fuera del rango aceptable',
    },
  },
  {
    code: 23, lamp: 'on',
    title: { en: 'Intake air temperature sensor', es: 'Sensor de temperatura de aire de admisión' },
    description: {
      en: 'Intake air temp sensor signal outside acceptable range',
      es: 'Señal del sensor de temperatura de aire de admisión fuera de rango',
    },
  },
  {
    code: 24, lamp: 'on',
    title: { en: 'Throttle position sensor', es: 'Sensor de posición del acelerador (TPS)' },
    description: {
      en: 'Throttle Position sensor signal outside acceptable range',
      es: 'Señal del sensor de posición del acelerador fuera de rango',
    },
  },
  {
    code: 25, lamp: 'on',
    title: { en: 'Idle air control motor', es: 'Motor de control de ralentí (IAC)' },
    description: {
      en: 'Idle air control motor circuit short or open condition detected',
      es: 'Cortocircuito o circuito abierto en el motor de control de aire de ralentí',
    },
  },
  {
    code: 27, lamp: 'intermittent',
    title: { en: 'Fuel injector circuit', es: 'Circuito de inyectores' },
    description: { en: 'Injector control circuit failure', es: 'Falla en el circuito de control de inyectores' },
  },
  {
    code: 31, lamp: 'on',
    title: { en: 'Evap (purge) solenoid circuit', es: 'Circuito del solenoide EVAP (purga)' },
    description: {
      en: 'Evap Solenoid circuit short or open condition detected',
      es: 'Cortocircuito o circuito abierto en el solenoide EVAP',
    },
  },
  {
    code: 32, lamp: 'on',
    title: { en: 'EGR solenoid circuit', es: 'Circuito del solenoide EGR' },
    description: {
      en: 'EGR Solenoid circuit short or open condition detected',
      es: 'Cortocircuito o circuito abierto en el solenoide EGR',
    },
  },
  {
    code: 33, lamp: 'intermittent',
    title: { en: 'A/C clutch relay circuit', es: 'Circuito del relé del embrague de A/A' },
    description: {
      en: 'A/C clutch relay circuit short or open condition detected',
      es: 'Cortocircuito o circuito abierto en el relé del embrague del aire acondicionado',
    },
  },
  {
    code: 34, lamp: 'intermittent',
    title: { en: 'Cruise (speed) control', es: 'Control de velocidad crucero' },
    description: {
      en: 'Speed control vacuum or vent circuit short or open condition detected OR speed control switch input outside accepted range',
      es: 'Cortocircuito o circuito abierto en el vacío o venteo del control de velocidad, O entrada del interruptor de control de velocidad fuera de rango',
    },
  },
  {
    code: 35, lamp: 'none',
    title: { en: 'Radiator fan relay circuit', es: 'Circuito del relé del electroventilador' },
    description: {
      en: 'Rad Fan control relay circuit short or open condition detected (4 cyl only)',
      es: 'Cortocircuito o circuito abierto en el relé de control del ventilador del radiador (solo 4 cilindros)',
    },
  },
  {
    code: 37, lamp: 'intermittent',
    title: { en: 'Torque converter / transmission', es: 'Convertidor de par / transmisión' },
    description: {
      en: "Torque converter clutch solenoid CKT or park/neutral switch failure OR Transmission Temperature sensor to high, which is specific to Ram PCM 94-up Dakotas don't have the transmission temperature sensor.",
      es: 'Falla en el circuito del solenoide del embrague del convertidor de par o del interruptor park/neutral, O sensor de temperatura de transmisión muy alto (específico de PCM Ram; las Dakota 94 en adelante no tienen ese sensor).',
    },
  },
  {
    code: 41, lamp: 'on',
    title: { en: 'Alternator field not switching', es: 'Campo del alternador no conmuta' },
    description: { en: 'Generator field not switching properly', es: 'El campo del alternador no conmuta correctamente' },
  },
  {
    code: 42, lamp: 'intermittent',
    title: { en: 'Fuel pump / ASD relay / fuel level', es: 'Bomba de combustible / relé ASD / nivel' },
    description: {
      en: 'Fuel pump relay control ckt, Auto shutdown relay control ckt, No ASD relay output voltage at PCM, Fuel level sending unit volts out of range, Fuel level unit No change over miles',
      es: 'Circuito de control del relé de bomba de combustible, circuito del relé de apagado automático (ASD), sin voltaje de salida del relé ASD en la PCM, voltaje del sensor de nivel de combustible fuera de rango, sensor de nivel sin cambio con el kilometraje',
    },
  },
  {
    code: 43, lamp: 'on',
    title: { en: 'Engine misfire', es: 'Falla de encendido (misfire)' },
    description: { en: 'Multiple/ single cylinder misfire', es: 'Falla de encendido en uno o varios cilindros' },
  },
  {
    code: 44, lamp: 'intermittent',
    title: { en: 'Battery temperature sensor', es: 'Sensor de temperatura de batería' },
    description: {
      en: 'Battery temp sensor volts out of accepted range',
      es: 'Voltaje del sensor de temperatura de batería fuera de rango',
    },
  },
  {
    code: 45, lamp: 'intermittent',
    title: { en: 'Overdrive solenoid circuit', es: 'Circuito del solenoide de overdrive' },
    description: {
      en: 'Transmission OD solenoid circuit short or open condition detected',
      es: 'Cortocircuito o circuito abierto en el solenoide de overdrive de la transmisión',
    },
  },
  {
    code: 46, lamp: 'on',
    title: { en: 'Charging voltage too high', es: 'Voltaje de carga muy alto' },
    description: { en: 'Charging system voltage too high', es: 'Voltaje del sistema de carga demasiado alto' },
  },
  {
    code: 47, lamp: 'on',
    title: { en: 'Charging voltage too low', es: 'Voltaje de carga muy bajo' },
    description: { en: 'Charging system voltage too low', es: 'Voltaje del sistema de carga demasiado bajo' },
  },
  {
    code: 51, lamp: 'on',
    title: { en: 'Fuel mixture too lean', es: 'Mezcla pobre' },
    description: { en: 'Fuel system lean', es: 'Sistema de combustible en mezcla pobre' },
  },
  {
    code: 52, lamp: 'on',
    title: { en: 'Fuel mixture too rich', es: 'Mezcla rica' },
    description: { en: 'Fuel system rich', es: 'Sistema de combustible en mezcla rica' },
  },
  {
    code: 53, lamp: 'intermittent',
    title: { en: 'Engine computer (PCM) failure', es: 'Falla interna de la computadora (PCM)' },
    description: { en: 'Internal PCM failure', es: 'Falla interna de la PCM' },
  },
  {
    code: 54, lamp: 'intermittent',
    title: { en: 'No camshaft signal', es: 'Sin señal de árbol de levas' },
    description: { en: 'No cam signal at PCM', es: 'Sin señal de árbol de levas en la PCM' },
  },
  {
    code: 55, lamp: 'intermittent', informational: true,
    title: { en: 'End of codes', es: 'Fin de códigos' },
    description: {
      en: 'End of error messages (If you get this only, no errors were found)',
      es: 'Fin de los mensajes de error (si solo aparece este, no se encontraron errores)',
    },
  },
  {
    code: 62, lamp: 'intermittent',
    title: { en: 'PCM failure – service mileage not stored', es: 'Falla PCM – km de servicio no guardados' },
    description: { en: 'PCM failure SRI mile not stored', es: 'Falla de PCM: kilometraje SRI no almacenado' },
  },
  {
    code: 63, lamp: 'intermittent',
    title: { en: 'PCM failure – memory write denied', es: 'Falla PCM – escritura de memoria denegada' },
    description: { en: 'PCM Failure EEPROM write denied', es: 'Falla de PCM: escritura de EEPROM denegada' },
  },
  {
    code: 64, lamp: 'on',
    title: { en: 'Catalytic converter efficiency', es: 'Eficiencia del catalizador' },
    description: { en: 'Catalytic Converter Efficiency Failure', es: 'Falla de eficiencia del convertidor catalítico' },
  },
  {
    code: 65, lamp: 'none',
    title: { en: 'Power steering switch', es: 'Interruptor de dirección hidráulica' },
    description: { en: 'Power steering switch failure', es: 'Falla del interruptor de la dirección hidráulica' },
  },
];

export const CODE_MAP: ReadonlyMap<number, FaultCode> = new Map(FAULT_CODES.map(c => [c.code, c]));

export function lookupCode(code: number): FaultCode | undefined {
  return CODE_MAP.get(code);
}
