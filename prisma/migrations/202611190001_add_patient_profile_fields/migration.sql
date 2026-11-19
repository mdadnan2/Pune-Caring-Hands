ALTER TABLE "patients"
  ADD COLUMN "alternatePhone" TEXT,
  ADD COLUMN "pinCode" TEXT,
  ADD COLUMN "mapsLink" TEXT,
  ADD COLUMN "gender" TEXT;

-- Preserve profile values that were captured in historical booking JSON when present.
WITH latest_profile AS (
  SELECT DISTINCT ON ("patientId")
    "patientId",
    "serviceDetails"
  FROM "bookings"
  WHERE "serviceDetails" IS NOT NULL
  ORDER BY "patientId", "createdAt" DESC
)
UPDATE "patients" AS p
SET
  "alternatePhone" = CASE WHEN jsonb_typeof(lp."serviceDetails"->'alternatePhone') = 'string'
    THEN lp."serviceDetails"->>'alternatePhone' ELSE p."alternatePhone" END,
  "pinCode" = CASE WHEN jsonb_typeof(lp."serviceDetails"->'pinCode') = 'string'
    THEN lp."serviceDetails"->>'pinCode' ELSE p."pinCode" END,
  "mapsLink" = CASE WHEN jsonb_typeof(lp."serviceDetails"->'mapsLink') = 'string'
    THEN lp."serviceDetails"->>'mapsLink' ELSE p."mapsLink" END,
  "gender" = CASE WHEN lp."serviceDetails"->>'gender' IN ('MALE', 'FEMALE', 'OTHER')
    THEN lp."serviceDetails"->>'gender' ELSE p."gender" END
FROM latest_profile AS lp
WHERE p."id" = lp."patientId";
