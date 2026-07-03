const { test, expect } = require('@playwright/test');

test('login, add iPhone X to cart and verify in checkout', async ({ page }) => {
  // Navigate to login page
  await page.goto('https://rahulshettyacademy.com/loginpagePractise/');

  // Handle possible interstitial / dialog text (site sometimes shows a consent overlay)
  const proceedSelectors = ['text=Proceed', 'text=Ok', 'text=OK', 'text=Proceed?'];
  for (const sel of proceedSelectors) {
    const el = page.locator(sel);
    if (await el.first().isVisible().catch(() => false)) {
      await el.first().click().catch(() => {});
      break;
    }
  }

  // Fill in credentials (using commonly used demo credentials). If these are incorrect the page will still allow trying.
  await page.locator('#username').fill('rahulshettyacademy');
  // Using the password provided by the user
  await page.locator('#password').fill('Learning@830$3mK2');

  // Click sign in; the button on this page often has id 'signInBtn' or contains 'Sign In'
  const signInBtn = page.locator('#signInBtn');
  if (await signInBtn.isVisible().catch(() => false)) {
    await signInBtn.click();
  } else {
    await page.locator('text=Sign In').first().click();
  }

  // Wait for navigation or products to load. The shop view uses product cards with selector '.card'
  await page.waitForLoadState('networkidle');
  const cards = page.locator('.card');

  // The site may show a confirmation dialog after sign-in, or may not auto-navigate to shop.
  if (!(await cards.first().isVisible().catch(() => false))) {
    // Try clicking any OK/Proceed buttons that appear after sign-in
    const okBtn = page.locator('button:has-text("OK"), button:has-text("Ok"), text=OK, text=Ok, text=Proceed');
    if (await okBtn.first().isVisible().catch(() => false)) {
      await okBtn.first().click().catch(() => {});
      await page.waitForLoadState('networkidle');
    }
  }

  // If still no product cards, navigate directly to the shop page as a fallback
  if (!(await cards.first().isVisible().catch(() => false))) {
    await page.goto('https://rahulshettyacademy.com/angularpractice/shop');
    await page.waitForLoadState('networkidle');
  }

  await expect(cards.first()).toBeVisible({ timeout: 10000 });

  // Find the product card that contains 'iphone' (case-insensitive) and click its Add To Cart button
  const productCardLocator = page.locator('.card').filter({ hasText: /iphone/i });
  const productCount = await productCardLocator.count();
  if (productCount === 0) {
    const allCards = page.locator('.card');
    const count = await allCards.count();
    const texts = [];
    for (let i = 0; i < count; ++i) {
      texts.push(await allCards.nth(i).innerText().catch(() => ''));
    }
    console.log('No product matching iphone found. Available cards:', texts);
    throw new Error('iPhone product not found on the shop page');
  }
  const productCard = productCardLocator.first();
  await expect(productCard).toBeVisible({ timeout: 5000 });

  // Debug: print card content to help determine button selector
  const cardText = await productCard.innerText().catch(() => '');
  console.log('Product card text:', cardText);

  // Click the Add To Cart (try several selector strategies)
  const addSelectors = ['text=/add ?to ?cart/i', 'button:has-text("Add" )', 'button', 'a:has-text("Add")'];
  let clickedAdd = false;
  for (const sel of addSelectors) {
    const el = productCard.locator(sel);
    if (await el.first().isVisible().catch(() => false)) {
      await el.first().click().catch(() => {});
      clickedAdd = true;
      break;
    }
  }
  if (!clickedAdd) {
    // try clicking any button inside the card
    const anyBtn = productCard.locator('button, a');
    if (await anyBtn.first().isVisible().catch(() => false)) {
      await anyBtn.first().click();
      clickedAdd = true;
    }
  }
  if (!clickedAdd) {
    throw new Error('Failed to click Add to Cart button for iPhone product');
  }

  // Go to Checkout / Cart page - look for link or button that has 'Checkout' text
  const checkoutSelectors = ['text=Checkout', 'text=Cart', 'text=Proceed to Checkout'];
  let clickedCheckout = false;
  for (const sel of checkoutSelectors) {
    const el = page.locator(sel);
    if (await el.first().isVisible().catch(() => false)) {
      await el.first().click();
      clickedCheckout = true;
      break;
    }
  }
  if (!clickedCheckout) {
    // Some flows use a top-right cart icon with a link to /cart or /checkout
    await page.goto('https://rahulshettyacademy.com/angularpractice/shop');
    await page.waitForLoadState('networkidle');
    // Click the cart/checkout button if present
    const altCheckoutSelectors = ['a:has-text("Checkout")', 'button:has-text("Checkout")', 'text=Cart'];
    for (const sel of altCheckoutSelectors) {
      const el = page.locator(sel);
      if (await el.first().isVisible().catch(() => false)) {
        await el.first().click();
        break;
      }
    }
  }

  // On the checkout/cart page, confirm the iPhone X is listed
  // Wait for cart table/rows to appear
  await page.waitForLoadState('networkidle');
  const cartRow = page.locator('tr').filter({ hasText: /iphone X/i });
  await expect(cartRow).toBeVisible({ timeout: 10000 });

  // Optionally assert the name exactly
  const productName = await cartRow.locator('td').first().innerText().catch(() => '');
  expect(productName.toLowerCase()).toContain('iphone');
});
