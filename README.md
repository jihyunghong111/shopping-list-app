# 🛒 쇼핑 리스트 앱

localStorage를 활용한 간단한 쇼핑 리스트 웹 앱입니다.

## 기능

- 아이템 추가 (버튼 클릭 또는 Enter 키)
- 체크박스로 완료 표시 (취소선 적용)
- 개별 아이템 삭제
- 완료 항목 일괄 삭제
- localStorage에 데이터 저장 (새로고침 후에도 유지)
- 전체/완료 개수 요약 표시

## 사용 방법

`shopping-list.html` 파일을 브라우저로 열면 바로 사용할 수 있습니다.

## 테스트 실행

```bash
npm install
node shopping-list.test.js
```

Playwright를 사용한 자동화 테스트 (13개 테스트 케이스)가 실행됩니다.
