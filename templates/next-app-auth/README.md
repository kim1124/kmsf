# Next App Auth Template

`templates/next-app-auth`는 auth 관련 참고/후속 템플릿 후보 디렉터리다.

현재 production scaffold catalog의 기본 경로는 `next-app-base`이며, 이 디렉터리는 아직 `create-kmsf`의 기본 생성 경로가 아니다.

## 참고 범위

- Supabase Auth 흐름 참고
- local file-backed auth store 참고
- auth DB 예시 구조 참고

## local DB 예시

예시 파일:

```text
templates/next-app-auth/.local/auth.db.example.json
```

런타임에서 사용할 때는 실제 앱의 `.local` 아래로 복사해 사용한다.

```bash
mkdir -p apps/kmsf/.local
cp templates/next-app-auth/.local/auth.db.example.json apps/kmsf/.local/auth.db.json
```

`.local/auth.db.json`은 계정 데이터와 password hash를 포함할 수 있으므로 Git에 커밋하지 않는다.
