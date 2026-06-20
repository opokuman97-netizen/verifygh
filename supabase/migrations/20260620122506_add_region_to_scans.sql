-- Add region column to scans for Ghana geographic analytics
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scans' AND column_name = 'region') THEN
    ALTER TABLE scans ADD COLUMN region text;
  END IF;
END $$;

-- Backfill region from location where possible (common Ghana cities → region)
UPDATE scans SET region = CASE
  WHEN lower(location) SIMILAR TO '%accra%|%tema%|%ashaiman%|%greater accra%' THEN 'Greater Accra'
  WHEN lower(location) SIMILAR TO '%kumasi%|%obuasi%|%ejisu%|%ashanti%' THEN 'Ashanti'
  WHEN lower(location) SIMILAR TO '%takoradi%|%sekondi%|%axim%|%western%' THEN 'Western'
  WHEN lower(location) SIMILAR TO '%cape coast%|%winneba%|%saltpond%|%central%' THEN 'Central'
  WHEN lower(location) SIMILAR TO '%ho%|%hohoe%|%keta%|%volta%' THEN 'Volta'
  WHEN lower(location) SIMILAR TO '%koforidua%|%nkawkaw%|%suhum%|%eastern%' THEN 'Eastern'
  WHEN lower(location) SIMILAR TO '%sunyani%|%bono%' THEN 'Bono'
  WHEN lower(location) SIMILAR TO '%techiman%|%nkoranza%|%bono east%' THEN 'Bono East'
  WHEN lower(location) SIMILAR TO '%tamale%|%yendi%|%northern%' THEN 'Northern'
  WHEN lower(location) SIMILAR TO '%bolgatanga%|%navrongo%|%bawku%|%upper east%' THEN 'Upper East'
  WHEN lower(location) SIMILAR TO '%wa%|%lawra%|%nandom%|%upper west%' THEN 'Upper West'
  WHEN lower(location) SIMILAR TO '%damongo%|%salaga%|%savannah%' THEN 'Savannah'
  WHEN lower(location) SIMILAR TO '%nalerigu%|%gambaga%|%north east%' THEN 'North East'
  WHEN lower(location) SIMILAR TO '%dambai%|%nkwanta%|%oti%' THEN 'Oti'
  WHEN lower(location) SIMILAR TO '%goaso%|%kukuom%|%ahafo%' THEN 'Ahafo'
  WHEN lower(location) SIMILAR TO '%sefwi%|%bibiani%|%western north%' THEN 'Western North'
  ELSE region
END
WHERE location IS NOT NULL AND region IS NULL;

CREATE INDEX IF NOT EXISTS idx_scans_region ON scans(region);
