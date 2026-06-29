import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Acknowledge Policy' button in the privacy modal to dismiss it so the 'Launch App' entry point becomes accessible.
        # Acknowledge Policy button
        elem = page.get_by_role('button', name='Acknowledge Policy', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Launch App' link/button in the page header to open the main study workspace.
        # Launch App link
        elem = page.get_by_role('link', name='Launch App', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the main workspace is displayed
        # Assert: The URL contains '/app', indicating the workspace route is loaded.
        await expect(page).to_have_url(re.compile("/app"), timeout=15000), "The URL contains '/app', indicating the workspace route is loaded."
        await page.locator("xpath=/html/body/div[3]/div[2]/aside/div[1]/div/div[2]/select").nth(0).scroll_into_view_if_needed()
        # Assert: The left panel shows the active document selector with 'Assignment_I'.
        await expect(page.locator("xpath=/html/body/div[3]/div[2]/aside/div[1]/div/div[2]/select").nth(0)).to_be_visible(timeout=15000), "The left panel shows the active document selector with 'Assignment_I'."
        await page.locator("xpath=/html/body/div[3]/div[1]/button[2]").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Doubt Bot' feature tab is visible in the top feature bar.
        await expect(page.locator("xpath=/html/body/div[3]/div[1]/button[2]").nth(0)).to_be_visible(timeout=15000), "The 'Doubt Bot' feature tab is visible in the top feature bar."
        await page.locator("xpath=/html/body/div[3]/div[2]/main/div/form/input").nth(0).scroll_into_view_if_needed()
        # Assert: The main workspace input field with its expected placeholder is present.
        await expect(page.locator("xpath=/html/body/div[3]/div[2]/main/div/form/input").nth(0)).to_be_visible(timeout=15000), "The main workspace input field with its expected placeholder is present."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    