# WELLNESS APP — Sprint 6.2
## Implementación terminada en el código
- Nueva migración PostgreSQL: perfiles, catálogo, documentos, observaciones, WHOOP, importaciones, fuentes, fragmentos RAG, reglas y auditoría.
- RLS habilitado en todas las tablas. Políticas de lectura por usuario para información personal.
- Los registros clínicos no admiten escritura directa desde el navegador; las importaciones futuras requieren control del servidor.
- Storage privado especificado con un bucket inicial; no está creado en Supabase hasta ejecutar las migraciones.
- Página de revisión en /sprint-6-2.
- Configuración de entorno modelada, sin credenciales reales.

## Pendiente — No declarar terminado
1. Crear/vincular proyecto Supabase y configurar sus claves en el entorno Vercel.
2. Validar migraciones en un proyecto aislado y revisar RLS contra accesos entre cuentas.
3. Implementar autenticación y endpoints de procesamiento seguros.
4. Validar el almacenamiento de PDFs y WHOOP con límites, auditoría y control de duplicados.
5. Ejecutar pruebas de restauración y respaldos.
6. Incorporar el catálogo y el historial conservando procedencia.

## Regla para los próximos sprints
El enlace directo debe apuntar al preview de la rama del sprint. Confirmar HTTP 200, compilación y /api/health antes de compartir.
No modificar ni sustituir la demo original.
