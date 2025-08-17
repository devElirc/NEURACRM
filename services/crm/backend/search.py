from playwright.sync_api import sync_playwright
import re
import time
import random

NAME = "John Smith"           # Change to target name
CITY = "Los Angeles"          # Optional
AGE_MIN = 30
AGE_MAX = 50

def human_delay(min_s=1.5, max_s=3.5):
    """Random delay to mimic human behavior."""
    time.sleep(random.uniform(min_s, max_s))

def solve_captcha_if_needed(page):
    """Pause for manual solve if human verification appears."""
    if page.locator("text=Verify you are human").is_visible():
        print("⚠ CAPTCHA detected! Please solve it manually in the browser window...")
        # Wait up to 2 minutes for you to solve
        page.wait_for_timeout(120000)
        print("✅ Continuing after CAPTCHA solve...")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)  # Keep visible so you can solve CAPTCHA
    context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                                             "AppleWebKit/537.36 (KHTML, like Gecko) "
                                             "Chrome/115.0.0.0 Safari/537.36")
    page = context.new_page()

    # Go to main page
    page.goto("https://www.truepeoplesearch.com/")
    human_delay()

    # Fill in search fields
    page.fill("#Name", NAME)
    if CITY:
        page.fill("#City", CITY)
    human_delay()

    # Click search
    page.click("#btnSubmit")
    page.wait_for_selector(".card-summary", timeout=30000)
    solve_captcha_if_needed(page)

    phone_numbers = []

    # Loop through search results
    results = page.query_selector_all(".card-summary")
    print(f"Found {len(results)} results.")

    for i, result in enumerate(results, start=1):
        human_delay(2, 4)

        # Extract age
        result_text = result.inner_text()
        match = re.search(r'Age\s+(\d+)', result_text)
        if not match:
            continue

        age = int(match.group(1))
        if AGE_MIN <= age <= AGE_MAX:
            print(f"[{i}] Age {age} ✅ - Opening details...")
            result.click()
            page.wait_for_selector(".contact-item", timeout=30000)
            solve_captcha_if_needed(page)

            # Extract phone numbers from details page
            numbers = page.query_selector_all(".contact-item")
            for num in numbers:
                phone = num.inner_text().strip()
                if phone and phone not in phone_numbers:
                    phone_numbers.append(phone)
                    print(f"   📞 {phone}")

            # Go back to results page
            page.go_back()
            page.wait_for_selector(".card-summary")
            solve_captcha_if_needed(page)
        else:
            print(f"[{i}] Age {age} ❌ - Skipping")

    print("\n✅ Finished scraping.")
    print("📄 Phone numbers found:")
    for pn in phone_numbers:
        print(pn)

    browser.close()
