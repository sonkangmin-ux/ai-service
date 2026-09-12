import { expect, test } from "@playwright/test";

test("new guest: diagnosis, base fail, remedial pass, next skill, refresh persists", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "가입 없이 체험" }).click();
  await page.getByRole("button", { name: "진단으로" }).click();

  for (let i = 0; i < 5; i += 1) {
    await page.getByLabel("모르겠어요").check();
    if (i < 4) await page.getByRole("button", { name: "다음" }).click();
  }
  await page.getByRole("button", { name: "제출" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "시작하기" }).click();
  await expect(page.getByText("이 앱은 코드를 실행하지 않습니다")).toBeVisible();
  await page.locator("textarea").first().fill("price * count");
  await page.getByRole("button", { name: "피드백 요청" }).click();
  await expect(page.locator('fieldset input[type="radio"]').first()).toBeEnabled({ timeout: 20_000 });
  const radios = page.locator("fieldset input[type=\"radio\"]");
  await radios.nth(1).check();
  await radios.nth(5).check();
  await page.getByRole("button", { name: "확인문제 제출" }).click();
  await expect(page.getByText("짧은 보충 과제를 준비했어요")).toBeVisible();
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.locator("textarea").first().fill("문자열 7과 숫자 7은 다릅니다. int('7')+2=9");
  await page.getByRole("button", { name: "피드백 요청" }).click();
  await expect(page.locator('fieldset input[type="radio"]').first()).toBeEnabled({ timeout: 20_000 });
  const after = page.locator("fieldset input[type=\"radio\"]");
  await after.nth(1).check();
  await after.nth(6).check();
  await page.getByRole("button", { name: "확인문제 제출" }).click();
  await expect(page.getByText("이제 조건문을 이어서 연습합니다")).toBeVisible();
  await expect(page.getByText("저장됨", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("이제 조건문을 이어서 연습합니다")).toBeVisible();
});
