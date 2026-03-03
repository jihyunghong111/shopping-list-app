const { chromium } = require('playwright');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, 'shopping-list.html').replace(/\\/g, '/');

// 결과 집계
const results = [];

function log(status, name, detail = '') {
  const icon = status === 'PASS' ? '✅' : '❌';
  const msg = `${icon} [${status}] ${name}${detail ? ' — ' + detail : ''}`;
  console.log(msg);
  results.push({ status, name });
}

async function runTests() {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page    = await browser.newPage();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🛒 쇼핑 리스트 앱 자동 테스트 시작');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // localStorage 초기화 후 페이지 로드
  await page.goto(FILE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // ── 테스트 1: 빈 상태 초기 화면 ──────────────────────────────
  try {
    const emptyMsg = await page.locator('.empty').textContent();
    if (emptyMsg.includes('아이템을 추가해 보세요')) {
      log('PASS', '초기 빈 상태 메시지 표시');
    } else {
      log('FAIL', '초기 빈 상태 메시지 표시', `예상 메시지 없음: "${emptyMsg}"`);
    }
  } catch (e) {
    log('FAIL', '초기 빈 상태 메시지 표시', e.message);
  }

  // ── 테스트 2: 아이템 추가 (버튼 클릭) ───────────────────────
  try {
    await page.fill('#itemInput', '사과');
    await page.click('button:has-text("추가")');
    const item = await page.locator('.item-text', { hasText: '사과' }).first();
    await item.waitFor({ timeout: 2000 });
    log('PASS', '아이템 추가 (버튼 클릭) — "사과"');
  } catch (e) {
    log('FAIL', '아이템 추가 (버튼 클릭)', e.message);
  }

  // ── 테스트 3: 아이템 추가 (Enter 키) ────────────────────────
  try {
    await page.fill('#itemInput', '바나나');
    await page.press('#itemInput', 'Enter');
    const item = await page.locator('.item-text', { hasText: '바나나' }).first();
    await item.waitFor({ timeout: 2000 });
    log('PASS', '아이템 추가 (Enter 키) — "바나나"');
  } catch (e) {
    log('FAIL', '아이템 추가 (Enter 키)', e.message);
  }

  // ── 테스트 4: 여러 아이템 추가 후 개수 확인 ─────────────────
  try {
    await page.fill('#itemInput', '우유');
    await page.press('#itemInput', 'Enter');
    const count = await page.locator('li').count();
    if (count === 3) {
      log('PASS', '복수 아이템 추가 — 총 3개 확인');
    } else {
      log('FAIL', '복수 아이템 추가', `예상 3개, 실제 ${count}개`);
    }
  } catch (e) {
    log('FAIL', '복수 아이템 추가', e.message);
  }

  // ── 테스트 5: 빈 입력으로 추가 시도 (무시 되어야 함) ────────
  try {
    await page.fill('#itemInput', '   ');
    await page.click('button:has-text("추가")');
    await page.waitForTimeout(300);
    const count = await page.locator('li').count();
    if (count === 3) {
      log('PASS', '빈 입력 추가 방지 — 개수 유지 (3개)');
    } else {
      log('FAIL', '빈 입력 추가 방지', `개수가 변했음: ${count}개`);
    }
  } catch (e) {
    log('FAIL', '빈 입력 추가 방지', e.message);
  }

  // ── 테스트 6: 체크박스 체크 ─────────────────────────────────
  try {
    const checkbox = await page.locator('li').first().locator('input[type="checkbox"]');
    await checkbox.click();
    await page.waitForTimeout(300);
    const isChecked = await checkbox.isChecked();
    const liClass   = await page.locator('li').first().getAttribute('class');
    if (isChecked && liClass.includes('checked')) {
      log('PASS', '체크박스 체크 — 취소선 클래스 적용 확인');
    } else {
      log('FAIL', '체크박스 체크', `isChecked=${isChecked}, class="${liClass}"`);
    }
  } catch (e) {
    log('FAIL', '체크박스 체크', e.message);
  }

  // ── 테스트 7: 체크 해제 ──────────────────────────────────────
  try {
    const checkbox = await page.locator('li').first().locator('input[type="checkbox"]');
    await checkbox.click(); // 다시 클릭해 해제
    await page.waitForTimeout(300);
    const isChecked = await checkbox.isChecked();
    const liClass   = await page.locator('li').first().getAttribute('class');
    if (!isChecked && !liClass.includes('checked')) {
      log('PASS', '체크박스 해제 — checked 클래스 제거 확인');
    } else {
      log('FAIL', '체크박스 해제', `isChecked=${isChecked}, class="${liClass}"`);
    }
  } catch (e) {
    log('FAIL', '체크박스 해제', e.message);
  }

  // ── 테스트 8: summary 카운트 업데이트 ───────────────────────
  try {
    const checkbox = await page.locator('li').first().locator('input[type="checkbox"]');
    await checkbox.click(); // 첫 번째 항목 체크
    await page.waitForTimeout(300);
    const summary = await page.locator('#summary').textContent();
    if (summary.includes('3') && summary.includes('1')) {
      log('PASS', '요약 카운트 업데이트 — 전체 3, 완료 1 표시');
    } else {
      log('FAIL', '요약 카운트 업데이트', `표시값: "${summary}"`);
    }
  } catch (e) {
    log('FAIL', '요약 카운트 업데이트', e.message);
  }

  // ── 테스트 9: "완료 항목 삭제" 버튼 표시 ────────────────────
  try {
    const clearBtn = await page.locator('#clearBtn');
    const visible  = await clearBtn.isVisible();
    if (visible) {
      log('PASS', '"완료 항목 삭제" 버튼 — 체크 시 표시');
    } else {
      log('FAIL', '"완료 항목 삭제" 버튼 — 체크 시 표시', '버튼이 보이지 않음');
    }
  } catch (e) {
    log('FAIL', '"완료 항목 삭제" 버튼 표시', e.message);
  }

  // ── 테스트 10: 완료 항목 일괄 삭제 ─────────────────────────
  try {
    await page.click('#clearBtn');
    await page.waitForTimeout(300);
    const count   = await page.locator('li').count();
    const visible = await page.locator('#clearBtn').isVisible();
    if (count === 2 && !visible) {
      log('PASS', '완료 항목 일괄 삭제 — 2개 남음, 버튼 숨김');
    } else {
      log('FAIL', '완료 항목 일괄 삭제', `남은 항목: ${count}개, 버튼 표시: ${visible}`);
    }
  } catch (e) {
    log('FAIL', '완료 항목 일괄 삭제', e.message);
  }

  // ── 테스트 11: 개별 삭제 버튼 ───────────────────────────────
  try {
    const beforeCount = await page.locator('li').count(); // 2
    await page.locator('li').first().locator('.delete-btn').click();
    await page.waitForTimeout(300);
    const afterCount = await page.locator('li').count();
    if (afterCount === beforeCount - 1) {
      log('PASS', `개별 삭제 — ${beforeCount}개 → ${afterCount}개`);
    } else {
      log('FAIL', '개별 삭제', `예상 ${beforeCount - 1}개, 실제 ${afterCount}개`);
    }
  } catch (e) {
    log('FAIL', '개별 삭제', e.message);
  }

  // ── 테스트 12: 마지막 아이템 삭제 후 빈 상태 ───────────────
  try {
    await page.locator('li').first().locator('.delete-btn').click();
    await page.waitForTimeout(300);
    const emptyMsg = await page.locator('.empty').textContent();
    if (emptyMsg.includes('아이템을 추가해 보세요')) {
      log('PASS', '모두 삭제 후 빈 상태 메시지 복귀');
    } else {
      log('FAIL', '모두 삭제 후 빈 상태 메시지 복귀', `내용: "${emptyMsg}"`);
    }
  } catch (e) {
    log('FAIL', '모두 삭제 후 빈 상태 메시지 복귀', e.message);
  }

  // ── 테스트 13: localStorage 저장 (새로고침 후 유지) ─────────
  try {
    await page.fill('#itemInput', '지속 항목');
    await page.press('#itemInput', 'Enter');
    await page.reload();
    await page.waitForSelector('li', { timeout: 2000 });
    const item = await page.locator('.item-text', { hasText: '지속 항목' }).first();
    await item.waitFor({ timeout: 2000 });
    log('PASS', 'localStorage 유지 — 새로고침 후 데이터 복원');
  } catch (e) {
    log('FAIL', 'localStorage 유지', e.message);
  }

  // ── 결과 요약 ────────────────────────────────────────────────
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  테스트 결과: ${passed} 통과 / ${failed} 실패 / ${results.length} 전체`);
  if (failed === 0) {
    console.log('  🎉 모든 테스트를 통과했습니다!');
  } else {
    console.log('  ⚠️  일부 테스트가 실패했습니다. 위 로그를 확인하세요.');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await page.waitForTimeout(1500);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('테스트 실행 오류:', err);
  process.exit(1);
});