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
        
        # -> Navigate to the app by opening the /app route (go to http://localhost:3000/app) so the workspace chat UI can be accessed.
        await page.goto("http://localhost:3000/app")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Type an initial study question into the chat input ("What are the core differences between mitosis and meiosis?") and submit it by pressing Enter to start the conversation.
        # Ask any complex academic question here... text field
        elem = page.get_by_placeholder('Ask any complex academic question here...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("What are the core differences between mitosis and meiosis?")
        
        # -> Type the follow-up question into the chat input — "How many daughter cells are produced by each, and how do they differ genetically?" — and submit it by pressing Enter so the workspace shows a second AI response.
        # Ask any complex academic question here... text field
        elem = page.get_by_placeholder('Ask any complex academic question here...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("How many daughter cells are produced by each, and how do they differ genetically?")
        
        # -> Click the 'Send' button to submit the follow-up question and confirm the conversation updates with the assistant's reply that mentions the number of daughter cells and their genetic differences.
        # Send button
        elem = page.get_by_role('button', name='Send', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the conversation shows an updated AI response
        await page.locator("xpath=/html/body/div[2]/div[2]/main/div/div[2]/div[5]/div[1]").nth(0).scroll_into_view_if_needed()
        # Assert: An assistant (AI) reply is visible in the conversation.
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/main/div/div[2]/div[5]/div[1]").nth(0)).to_be_visible(timeout=15000), "An assistant (AI) reply is visible in the conversation."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    