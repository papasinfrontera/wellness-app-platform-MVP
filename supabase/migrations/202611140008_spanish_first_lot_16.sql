-- Sprint 6.5-D.1: labels and aliases only, preserving all UUIDs, codes, units, and clinical values.
-- Pilot names in Spanish remain unchanged. Review_status='pilot' until user/scientific sign-off.
update public.indicators as i
 set name_es=v.name_es,name_en=v.name_en
 from (values
('REF-019','Hemoglobina glucosilada (HbA1c)','Hemoglobin A1c (HbA1c)'),
('REF-020','Proteína C reactiva de alta sensibilidad (PCR-us)','High-Sensitivity C-Reactive Protein (hs-CRP)'),
('REF-021','Fósforo','Phosphorus'),
('REF-022','Potasio','Potassium'),
('REF-023','Recuento de glóbulos rojos (RBC)','Red Blood Cell Count (RBC)'),
('REF-024','Ácido úrico','Uric Acid (UA)'),
('REF-026','Alanina aminotransferasa (ALT)','Alanine Aminotransferase (ALT)'),
('REF-027','Albúmina','Albumin'),
('REF-029','Fosfatasa alcalina (ALP)','Alkaline Phosphatase (ALP)'),
('REF-030','Aspartato aminotransferasa (AST)','Aspartate Aminotransferase (AST)'),
('REF-033','Calcio','Calcium'),
('REF-034','Cloruro','Chloride'),
('REF-036','Creatinina','Creatinine'),
('REF-042','Hemoglobina','Hemoglobin')
 ) as v(code,name_es,name_en)
 where i.code=v.code
 and (i.name_en is null or i.name_en=v.name_en);

insert into public.indicator_aliases(indicator_id,alias,locale,review_status)
select i.id,v.alias,v.locale,'pilot'
 from (values
('REF-019','Hemoglobina glucosilada (HbA1c)','es'),
('REF-019','Hemoglobin A1c (HbA1c)','en'),
('REF-019','Hemoglobina glicosilada','es'),
('REF-019','Hemoglobina A1c','es'),
('REF-019','HbA1c','es'),
('REF-020','Proteína C reactiva de alta sensibilidad (PCR-us)','es'),
('REF-020','High-Sensitivity C-Reactive Protein (hs-CRP)','en'),
('REF-020','PCR ultrasensible','es'),
('REF-020','PCR de alta sensibilidad','es'),
('REF-020','hs-CRP','es'),
('REF-021','Fósforo','es'),
('REF-021','Phosphorus','en'),
('REF-021','Fósforo sérico','es'),
('REF-022','Potasio','es'),
('REF-022','Potassium','en'),
('REF-022','Potasio sérico','es'),
('REF-023','Recuento de glóbulos rojos (RBC)','es'),
('REF-023','Red Blood Cell Count (RBC)','en'),
('REF-023','Recuento de eritrocitos','es'),
('REF-023','Hematíes','es'),
('REF-023','RBC','es'),
('REF-024','Ácido úrico','es'),
('REF-024','Uric Acid (UA)','en'),
('REF-024','Uricemia','es'),
('REF-024','Urato','es'),
('REF-026','Alanina aminotransferasa (ALT)','es'),
('REF-026','Alanine Aminotransferase (ALT)','en'),
('REF-026','ALT','es'),
('REF-026','TGP','es'),
('REF-026','Transaminasa glutámico-pirúvica','es'),
('REF-027','Albúmina','es'),
('REF-027','Albumin','en'),
('REF-027','Albúmina sérica','es'),
('REF-029','Fosfatasa alcalina (ALP)','es'),
('REF-029','Alkaline Phosphatase (ALP)','en'),
('REF-029','Fosfatasa alcalina','es'),
('REF-029','ALP','es'),
('REF-029','FA','es'),
('REF-030','Aspartato aminotransferasa (AST)','es'),
('REF-030','Aspartate Aminotransferase (AST)','en'),
('REF-030','AST','es'),
('REF-030','TGO','es'),
('REF-030','Transaminasa glutámico-oxalacética','es'),
('REF-033','Calcio','es'),
('REF-033','Calcium','en'),
('REF-033','Calcio total','es'),
('REF-034','Cloruro','es'),
('REF-034','Chloride','en'),
('REF-034','Cloro sérico','es'),
('REF-034','Cloruros','es'),
('REF-036','Creatinina','es'),
('REF-036','Creatinine','en'),
('REF-036','Creatinina sérica','es'),
('REF-042','Hemoglobina','es'),
('REF-042','Hemoglobin','en'),
('REF-042','Hb','es'),
('REF-042','Hgb','es')
 ) as v(code,alias,locale)
 join public.indicators i on i.code=v.code
on conflict do nothing;
