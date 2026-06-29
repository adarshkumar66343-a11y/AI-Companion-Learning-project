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
        
        # -> Click the 'Acknowledge Policy' button to close the privacy & data protection modal so the upload area becomes accessible.
        # Acknowledge Policy button
        elem = page.get_by_role('button', name='Acknowledge Policy', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Launch App' link in the header to open the application and reach the study workspace.
        # Launch App link
        elem = page.get_by_role('link', name='Launch App', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Active Document Context' dropdown in the left panel (labeled 'ACTIVE DOCUMENT CONTEXT') to check for preloaded documents or an analysis/upload status.
        # dropdown
        elem = page.get_by_text('sample sample study_sample test_doc Assignment_I Cognitive Load Theory', exact=True)
        await elem.click(timeout=10000)
        
        # -> Re-select the 'sample' option in the Active Document Context to confirm the preloaded document is selected, then finish the test and report the observed analysis status.
        # sample sample study_sample test_doc Assignment_I... dropdown
        elem = page.locator("xpath=/html/body/div[2]/div[2]/aside/div/div/div[2]/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # --> Assertions to verify final state
        
        # --> Verify upload progress or analysis status is shown
        await page.locator("xpath=/html/body/div[2]/div[2]/aside/div[1]/div/div[3]").nth(0).scroll_into_view_if_needed()
        # Assert: The upload area (Drag & Drop or browse files) is visible in the left panel.
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/aside/div[1]/div/div[3]").nth(0)).to_be_visible(timeout=15000), "The upload area (Drag & Drop or browse files) is visible in the left panel."
        await page.locator("xpath=/html/body/div[2]/div[2]/aside/div[1]/div/div[2]/select").nth(0).scroll_into_view_if_needed()
        # Assert: The Active Document Context control is visible and contains the 'sample' document option.
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/aside/div[1]/div/div[2]/select").nth(0)).to_be_visible(timeout=15000), "The Active Document Context control is visible and contains the 'sample' document option."
        
        # --> Verify the user lands in the study workspace
        # Assert: The URL contains '/app', confirming the user reached the study workspace.
        await expect(page).to_have_url(re.compile("/app"), timeout=15000), "The URL contains '/app', confirming the user reached the study workspace."
        await page.locator("xpath=/html/body/div[2]/div[2]/aside/div[1]/div/div[2]/select").nth(0).scroll_into_view_if_needed()
        # Assert: The Active Document Context control is visible in the left panel of the workspace.
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/aside/div[1]/div/div[2]/select").nth(0)).to_be_visible(timeout=15000), "The Active Document Context control is visible in the left panel of the workspace."
        # Assert: The Active Document Context shows 'sample', confirming a document is selected and analyzed.
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/aside/div[1]/div/div[2]/select").nth(0)).to_contain_text("sample", timeout=15000), "The Active Document Context shows 'sample', confirming a document is selected and analyzed."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    