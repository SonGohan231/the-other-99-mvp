# Apply this patch to PR #36

Copy these files into the repository root on branch:

`patch/stage1-resume-summary-controls`

Files included:

- `public/v3/TO99_questions_master.csv`
- `public/v3/TO99_answers_long.csv`
- `public/v3/TO99_validation_summary.csv`
- `public/v3/TO99_database_schema.csv`
- `public/v3/TO99_license_audit.csv`
- `src/types/contentV2.ts`
- `src/utils/csvLoaderV2.ts`
- `docs/TO99_DATABASE_V3_IMPORT.md`

Then remove old files:

- `public/v2/questions_all_2650.csv`
- `public/v2/answers_all_5300.csv`

Validate:

```bash
npx tsc --noEmit
npm run build
```

Runtime expectation:

- 2400 questions loaded
- 9600 answers loaded
- exactly 4 answers per question
- social comparison label must remain estimated until real backend votes exist
