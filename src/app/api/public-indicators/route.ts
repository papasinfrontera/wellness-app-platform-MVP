import catalog from "../../(dashboard)/mi-analisis/catalog-reference.json";
export async function GET(){
 return Response.json({version:"sprint-6-5",count:catalog.length,indicators:catalog},{headers:{"Cache-Control":"public, max-age=3600"}});
}
