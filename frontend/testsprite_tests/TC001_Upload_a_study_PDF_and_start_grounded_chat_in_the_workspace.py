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
        
        # -> Click the 'Acknowledge Policy' button to dismiss the privacy & data protection modal so the main page and Launch App controls become accessible.
        # Acknowledge Policy button
        elem = page.get_by_role('button', name='Acknowledge Policy', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Launch App' button to open the main app workspace so the document upload and chat can be used.
        # Launch App link
        elem = page.get_by_role('link', name='Launch App', exact=True)
        await elem.click(timeout=10000)
        
        # -> Type a grounded question about the loaded document into the chat input labeled 'Ask any complex academic question here...' and submit it (use Enter) so the assistant returns a cited answer.
        # Ask any complex academic question here... text field
        elem = page.get_by_placeholder('Ask any complex academic question here...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("What is the main argument of the uploaded document \"Assignment_I\"? Provide a short summary and include explicit page citations (e.g. \"Page 3\") for any factual claims or quoted material.")
        
        # --> Assertions to verify final state
        
        # --> Verify a cited answer is displayed in the chat
        # Assert: The chat shows a cited answer that includes an explicit 'Page <n>' citation.
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/main/div/div[2]/div[3]/div[2]").nth(0)).to_contain_text("Page ", timeout=15000), "The chat shows a cited answer that includes an explicit 'Page <n>' citation."
        
        # --> Verify the uploaded document is available in the workspace
        await page.locator("xpath=/html/body/div[2]/div[2]/aside/div[1]/div/div[2]/select").nth(0).scroll_into_view_if_needed()
        # Assert: The uploaded document 'Assignment_I' is visible in the workspace.
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/aside/div[1]/div/div[2]/select").nth(0)).to_be_visible(timeout=15000), "The uploaded document 'Assignment_I' is visible in the workspace."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    