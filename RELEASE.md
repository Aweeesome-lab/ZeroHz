# ZeroHz 릴리스 가이드

이 문서는 ZeroHz 애플리케이션의 새 버전을 릴리스하고 자동 업데이트를 배포하는 방법을 설명합니다.

## 사전 준비

### GitHub Secrets 설정

자동 업데이트 기능이 작동하려면 GitHub 리포지토리에 다음 Secrets를 추가해야 합니다:

1. **GitHub 리포지토리 페이지로 이동**

   - https://github.com/Aweeesome-lab/ZeroHz

2. **Settings > Secrets and variables > Actions로 이동**

3. **다음 Secrets 추가:**

#### `TAURI_PRIVATE_KEY`

서명에 사용되는 개인 키입니다. 다음 값을 복사해서 붙여넣으세요:

```
dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWduIGVuY3J5cHRlZCBzZWNyZXQga2V5ClJXUlRZMEl5UW9MVGhtSXV0cWcrMFlpa3VWUmxLakM5Z2R1OFlvYjAybWpUdzBJcUVOa0FBQkFBQUFBQUFBQUFBQUlBQUFBQWJGb3RsKzZvV01nQ202bVZOb2tQNE04QjdvcUkySm1MbktDbHdqU29jZEpuZVRSaStSUHBTdWxkc2xCZVRYa2lBUkMzN2pwNytUYTBScS9seFR5Wk83VWM2MitodVZxMG1QS0NMNjVkbzdzSWtud3hQMmRqdGIwbzZCS25JNyt3djNKbW9YODFselk9Cg==
```

> [!CAUTION]
> 이 키는 절대 공개되어서는 안 됩니다! GitHub Secrets에만 보관하고 코드에 커밋하지 마세요.

#### `TAURI_KEY_PASSWORD`

현재는 패스워드 없이 키를 생성했으므로 빈 값으로 설정하세요:

```
(빈 값으로 남겨두기)
```

---

## 릴리스 프로세스

### 1. 버전 업데이트

새 릴리스를 만들기 전에 버전 번호를 업데이트해야 합니다:

#### a) `src-tauri/Cargo.toml` 수정

```toml
[package]
version = "0.2.0"  # 새 버전 번호로 변경
```

#### b) `package.json` 수정

```json
{
  "version": "0.2.0"  # 같은 버전 번호로 변경
}
```

#### c) `src-tauri/tauri.conf.json` 수정

```json
{
  "version": "0.2.0"  # 같은 버전 번호로 변경
}
```

### 2. 변경사항 커밋

```bash
git add .
git commit -m "chore: bump version to 0.2.0"
git push
```

### 3. Git 태그 생성 및 푸시

```bash
# 태그 생성 (v 접두사 필수)
git tag v0.2.0

# 태그 푸시
git push origin v0.2.0
```

### 4. GitHub Actions 워크플로우 실행 확인

1. GitHub 리포지토리의 **Actions** 탭으로 이동
2. "Release" 워크플로우가 실행되는지 확인
3. 빌드가 완료될 때까지 대기 (약 10-15분 소요)

### 5. Draft 릴리스 검토 및 배포

1. GitHub 리포지토리의 **Releases** 페이지로 이동
2. Draft 상태인 새 릴리스를 찾기
3. 릴리스 노트를 작성하거나 수정
4. **Publish release** 버튼을 클릭하여 릴리스 배포

---

## 자동 업데이트 테스트

### 사용자 관점에서 테스트

1. **이전 버전 설치**

   - 이전 릴리스의 DMG/installer를 다운로드하여 설치

2. **업데이트 확인**

   - 앱을 실행
   - 트레이 아이콘을 클릭
   - "Check for Updates" 메뉴 선택

3. **업데이트 다운로드 및 설치**
   - 업데이트가 감지되면 자동으로 다운로드
   - 다운로드 완료 후 앱 재시작
   - 새 버전으로 업데이트되었는지 확인 (트레이 메뉴에서 버전 확인)

---

## 문제 해결

### 업데이트가 감지되지 않는 경우

1. **latest.json 파일 확인**

   - https://github.com/Aweeesome-lab/ZeroHz/releases/latest/download/latest.json
   - 이 파일이 존재하고 올바른 버전 정보가 있는지 확인

2. **서명 검증 확인**

   - 앱 로그에서 서명 검증 오류가 있는지 확인
   - GitHub Secrets의 `TAURI_PRIVATE_KEY`가 올바르게 설정되었는지 확인

3. **릴리스가 Draft 상태인지 확인**
   - Draft 릴리스는 자동 업데이트에서 감지되지 않습니다
   - 반드시 **Publish**해야 합니다

### GitHub Actions 빌드 실패

1. **로그 확인**

   - Actions 탭에서 실패한 워크플로우 로그 확인

2. **Secrets 확인**
   - `TAURI_PRIVATE_KEY`와 `TAURI_KEY_PASSWORD`가 올바르게 설정되었는지 확인

---

## 보안 주의사항

> [!WARNING] > **개인 키 보안**
>
> - 개인 키 파일(`~/.tauri/ZeroHz.key`)은 안전하게 보관하세요
> - 절대 Git 리포지토리에 커밋하지 마세요
> - 백업을 안전한 곳에 보관하세요 (키를 잃어버리면 업데이트 배포 불가)

> [!TIP] > **패스워드 보호 권장**
>
> - 추후 보안 강화를 위해 패스워드로 보호된 키를 생성하는 것을 권장합니다
> - 패스워드를 사용하려면 키를 재생성하고 `TAURI_KEY_PASSWORD` Secret을 설정하세요

---

## 참고 자료

- [Tauri Updater 문서](https://tauri.app/v2/guides/distribution/updater/)
- [tauri-action GitHub Actions](https://github.com/tauri-apps/tauri-action)
