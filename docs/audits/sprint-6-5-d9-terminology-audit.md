# Sprint 6.5-D.9 — Auditoría técnica del catálogo bilingüe
Fecha de revisión: 2026-11-14. Estado: **AUDITORÍA TÉCNICA CON HALLAZGOS; VALIDACIÓN CLÍNICA PENDIENTE**.

## Alcance y evidencia
- Catálogo fuente: `src/app/(dashboard)/mi-analisis/catalog-reference.json`.
- Supabase `public.indicators`: 128 identidades, 128 nombres en español y en inglés, 128 códigos únicos; sin códigos LOINC ni unidades canónicas asignadas (consulta de verificación 2026-11-14).
- Supabase `public.indicator_aliases`: 485 registros para 128 indicadores. Alias en estado `pilot` (no validar clínicamente por conteos).
- `public.observations`: 0 registros al verificar. No se han importado análisis de PDF ni cambios de resultados.
- La revisión automática comprueba integridad y colisiones textuales; **no constituye validación de terminología LOINC, métodos, resultados, unidades, intervalos ni evidencia científica**.
- 491 entradas textuales de `name`, `name_en` y aliases locales (incluye duplicados intraindicador), 480 claves después de una normalización potencialmente destructiva; **2 colisiones entre códigos diferentes**.

## Hallazgo bloqueante: PSA
| Clave normalizada | Etiquetas distintas | Identidades |
| --- | --- | --- |
| `psa free` | `PSA %, Free` y `PSA, Free` | REF-111 (porcentaje) y REF-112 (concentración) |
| `psa libre` | `PSA libre (%)` y `PSA libre` | REF-111 y REF-112 |

**Causa:** normalización que elimina `%`, paréntesis y comas. **Medida:** no usar una coincidencia de texto normalizado como confirmación para guardar resultados. Exigir información de porcentaje o concentración, unidad, muestra, método y revisión por el usuario. No se han eliminado ni fusionado códigos.

## Riesgos de interpretación que requieren protocolo
| IDs | Distinción | Requisito pendiente |
| --- | --- | --- |
| REF-016 / REF-017 | Glucosa media estimada vs medición directa | Distinguir cálculo frente a analito medido |
| REF-033 / REF-035 | Calcio total vs calcio corregido | Método/fórmula y unidad |
| REF-071 / REF-072 / REF-078 | Cistatina C vs eGFR por cistatina C vs eGFR no especificado | Fórmula, analitos y metodología de estimación |
| REF-085 / REF-086 / REF-121 / REF-122 | Testosterona libre, calculada, testosterona genérica e inmunoensayo | Tipo de ensayo, estado libre/total, método y muestra |
| REF-111 / REF-112 / REF-113 | Porcentaje PSA libre, PSA libre y PSA total | Unidad %, concentración y método |
| REF-125 | TIBC | Distinguir de hierro y saturación de transferrina |
| REF-127 | Vitamina D genérica | Identificar 25-OH D vs 1,25-(OH)₂ D o determinación diferente |
| REF-066 | CO₂ total | No asumir equivalencia con bicarbonato calculado sin método |
| REF-081 | Folato | No equiparar folato sérico, eritrocitario o ácido fólico sin contexto |
| REF-069 | Cortisol | Distinguir sangre, saliva, orina, tiempo y protocolo |
| REF-116 / REF-117 | Recuento reticulocitario vs índice | No equiparar magnitudes ni unidades |

## Estado de aprobación
- Traducción inicial: **128/128 completada técnicamente**.
- Auditoría de colisiones textuales: **ejecutada**; 2 claves ambiguas de PSA encontradas.
- Revisión de unidades canónicas: **pendiente (0/128 en Supabase)**.
- Asignación LOINC técnica: **pendiente (0/128)**. No asignar códigos sin validar analito, propiedad, tiempo, sistema, escala y método.
- Revisión científica y editorial formal: **pendiente**.
- Importación PDF completa: **no desarrollada**; el piloto existente identifica únicamente los nombres ApoB y Glucosa, sin guardado automático.
- Validación end-to-end de PDF: **pendiente de archivos reales anonimados y revisión clínica**.
- No autorizar importación automática ni mezcla de resultados derivados/directos hasta cerrar bloqueantes.

## Criterios de salida para Sprint 6.6
1. Tabla de sinónimos versionados con estado validado por especialista y taxonomía de métodos/muestras.
2. Prototipo de extracción PDF que preserve literalmente etiqueta, valor, unidad, fecha, método y documento.
3. Motor de candidatos no destructivo que **se abstenga** ante colisiones o evidencia insuficiente.
4. Revisión y consentimiento explícitos antes de persistir un resultado; auditoría de acciones y RLS por paciente.
5. Pruebas con informes originales variados y métricas de precisión/abstención trazables.
