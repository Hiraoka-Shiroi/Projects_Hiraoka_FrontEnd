# Созданные файлы

- Запустить академию.cmd — запуск Windows без PowerShell, добавлен при устранении ошибки npm.ps1.

Все перечисленные файлы находятся внутри отдельной папки frontend-academy. Зависимости node_modules, собранные файлы dist и временные результаты тестов перечисляются как каталоги, без тысяч сторонних файлов.

- .gitignore
- AGENTS.md
- docs/ASSESSMENT.md
- docs/CAREER.md
- docs/IMPLEMENTATION-PLAN.md
- docs/LEARNING-STATE.md
- docs/original-files-before.json
- docs/original-files-verification.json
- docs/ROADMAP.md
- docs/screenshots/desktop-dashboard.png
- docs/screenshots/desktop-lesson9.png
- docs/screenshots/mobile-dashboard.png
- docs/screenshots/mobile-lesson9.png
- docs/SOURCE-HISTORY.md
- index.html
- materials/9_функции.js
- package-lock.json
- package.json
- playwright.config.ts
- README.md
- scripts/check-source.mjs
- src/App.tsx
- src/components/common.tsx
- src/components/ImportDialog.tsx
- src/components/LessonProgressPanel.tsx
- src/components/Shell.tsx
- src/data/course.ts
- src/data/curriculum.json
- src/data/lesson9.json
- src/data/notes.ts
- src/data/projects.json
- src/data/stages.json
- src/hooks/useProgress.ts
- src/lib/progress.ts
- src/lib/storage.ts
- src/main.tsx
- src/pages/Dashboard.tsx
- src/pages/LessonPage.tsx
- src/pages/Projects.tsx
- src/pages/Report.tsx
- src/pages/Roadmap.tsx
- src/styles.css
- src/types.ts
- tests/academy.spec.ts
- tests/curriculum.test.ts
- tests/progress.test.ts
- tsconfig.json
- vite.config.ts
- docs/CREATED-FILES.md
- docs/VERIFICATION.md

Созданы также: node_modules/ (установленные зависимости), dist/ (проверенная сборка), test-results/ (артефакты браузерных тестов).

Добавлены при обновлении урока и дизайна:

- materials/9_функции_по-шагам.js
- src/data/lesson9.steps.json
- src/data/guides.ts
- src/components/GuidedLesson.tsx
- src/components/Icon.tsx
- src/academy.css
- public/academy-mark.svg
- tests/guided.test.ts
- tests/lesson-workspace.spec.ts

Добавлены при проверке надёжности и учебных инструментов:

- src/components/QuickSearch.tsx
- src/components/quick-search.css
- src/components/SelfCheck.tsx
- src/components/CopyButton.tsx
- src/data/selfChecks.ts
- src/lib/routes.ts
- src/lib/reviewBundle.ts
- tests/quick-search.spec.ts
- tests/reliability.test.ts
- tests/reliability.spec.ts

Добавлены при подготовке настоящих аккаунтов и уроков 1–8:

- DEPLOYMENT.md
- Dockerfile
- .dockerignore
- server/api.ts
- server/index.ts
- src/lib/api.ts
- src/hooks/useAccount.ts
- src/components/AuthGate.tsx
- src/components/AccountDialog.tsx
- src/components/LessonPreview.tsx
- scripts/test-server.ts
- scripts/check-production.mjs
- tests/server.test.ts
- tests/fixtures.ts
- tests/accounts.spec.ts
- tests/convenience.spec.ts
- src/data/lesson1.json … src/data/lesson8.json (по одному полному уроку на файл)
- src/data/lesson1.steps.json … src/data/lesson8.steps.json (по четыре коротких шага на урок)
- materials/1_переменные.js
- materials/2_арифметика.js
- materials/3_типы-данных.js
- materials/4_условия-if-else.js
- materials/5_логические-операторы.js
- materials/6_else-if-и-несколько-условий.js
- materials/7_truthy-и-falsy.js
- materials/8_тернарный-оператор.js
- docs/screenshots/desktop-registration.png
- docs/screenshots/mobile-registration.png
- docs/screenshots/mobile-lesson1.png

Приватная runtime-база data/academy.sqlite создаётся при запуске сервера; она и временные базы academy.test-data/ исключены из Git и Docker-контекста. Пароли по умолчанию и готовый личный аккаунт не создаются.
