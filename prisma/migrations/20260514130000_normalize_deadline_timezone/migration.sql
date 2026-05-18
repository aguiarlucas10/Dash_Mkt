-- Normaliza deadlines salvos em 00:00 UTC para 12:00 UTC.
-- Motivo: <input type="date"> entrega "YYYY-MM-DD"; o código antigo fazia
-- `new Date(string).toISOString()`, que interpreta a string como meia-noite UTC.
-- Em UTC-3 (Brasil), isso vira 21:00 do dia anterior ao formatar com timezone local,
-- mostrando o card com 1 dia a menos no Kanban e no Calendário.
--
-- O fix do código passou a salvar como meio-dia UTC. Esta migration corrige
-- os registros já salvos com o padrão antigo. Só toca deadlines exatamente em
-- 00:00:00 UTC para não afetar valores que por algum motivo já tinham hora
-- explícita.

UPDATE "CreativeTask"
SET "deadline" = "deadline" + INTERVAL '12 hours'
WHERE "deadline" IS NOT NULL
  AND EXTRACT(HOUR FROM "deadline" AT TIME ZONE 'UTC') = 0
  AND EXTRACT(MINUTE FROM "deadline" AT TIME ZONE 'UTC') = 0
  AND EXTRACT(SECOND FROM "deadline" AT TIME ZONE 'UTC') = 0;
