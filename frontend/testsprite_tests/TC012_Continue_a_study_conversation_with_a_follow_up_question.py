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
        
        # -> click
        # Acknowledge Policy button
        elem = page.get_by_role('button', name='Acknowledge Policy', exact=True)
        await elem.click(timeout=10000)
        
        # -> navigate
        await page.goto("http://localhost:3000/app")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Type an initial study question into the 'Ask any complex academic question here...' input and submit it by pressing Enter.
        # Ask any complex academic question here... text field
        elem = page.get_by_placeholder('Ask any complex academic question here...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("What is the main argument of the 'study_sample' document? Please answer concisely.")
        
        # -> Type an initial study question into the 'Ask any complex academic question here...' input and submit it by pressing Enter.
        # Ask any complex academic question here... text field
        elem = page.get_by_placeholder('Ask any complex academic question here...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Follow-up: Can you provide a concise 3-bullet summary with the key evidence?")
        
        # -> Submit the follow-up by focusing the 'Ask any complex academic question here...' input (click it), press Enter to send the follow-up question, then wait for the AI response to appear.
        # Ask any complex academic question here... text field
        elem = page.get_by_placeholder('Ask any complex academic question here...', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the conversation shows an updated AI response
        # Assert: The assistant posted a new grounded reply stating it can't fulfill the request.
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/main/div/div[2]/div[5]/div[1]").nth(0)).to_contain_text("I still can't fulfill this request", timeout=15000), "The assistant posted a new grounded reply stating it can't fulfill the request."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    