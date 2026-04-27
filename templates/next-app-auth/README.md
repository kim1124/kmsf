# Next App Auth 템플릿

인증이 포함된 Next.js 앱 템플릿 디렉터리다.

## 인증 Provider

- Supabase: 기본 권장 provider다. E-mail/PW, Google OAuth, Supabase Auth 세션을 사용한다.
- local-json: ID/PW 기반 starter provider다. `db.json` 형태의 로컬 JSON 파일을 사용하며 커스터마이징하기 쉽도록 제공한다.

자세한 설정은 저장소 문서의 `docs/auth-guide.md`를 참고한다.

## local-json 예시 DB

예시 파일:

```text
templates/next-app-auth/.local/auth.db.example.json
```

런타임에서 사용할 때는 아래처럼 복사한다.

```bash
mkdir -p apps/kmsf/.local
cp templates/next-app-auth/.local/auth.db.example.json apps/kmsf/.local/auth.db.json
```

`apps/kmsf/.local/auth.db.json`은 계정 데이터와 password hash를 포함할 수 있으므로 커밋하지 않는다.
