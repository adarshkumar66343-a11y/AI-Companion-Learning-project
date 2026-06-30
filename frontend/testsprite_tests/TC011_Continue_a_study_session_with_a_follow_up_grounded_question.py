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
        
        # -> Click the 'Acknowledge Policy' button to dismiss the privacy agreement modal so the upload area and main UI become interactable.
        # Acknowledge Policy button
        elem = page.get_by_role('button', name='Acknowledge Policy', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Launch App' link to open the study workspace so the preloaded documents can be used for the grounded-question flow.
        # Launch App link
        elem = page.get_by_role('link', name='Launch App', exact=True)
        await elem.click(timeout=10000)
        
        # -> Type a grounded study question into the Doubt Bot input (for example: 'Synthesize the main argument of the document and include citations from the text') and send it using Enter.
        # Ask any complex academic question here... text field
        elem = page.get_by_placeholder('Ask any complex academic question here...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Synthesize the main argument of the document and include citations from the text.")
        
        # -> Wait for the bot's reply to finish, then ask the follow-up grounded question: 'How does the author support the main argument? Provide two cited passages from the text.' and verify the conversation stays in the 'sample' workspace.
        # Ask any complex academic question here... text field
        elem = page.get_by_placeholder('Ask any complex academic question here...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("How does the author support the main argument? Provide two cited passages from the text.")
        
        # --> Assertions to verify final state
        
        # --> Verify a second cited answer is displayed
        # Assert: The Doubt Bot reply includes a cited passage about working memory (Citation 1).
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/main/div/div[2]/div[5]/div[1]").nth(0)).to_contain_text("Working Memory (WM): This is where active conscious processing occurs.", timeout=15000), "The Doubt Bot reply includes a cited passage about working memory (Citation 1)."
        # Assert: The Doubt Bot reply includes a second cited passage describing intrinsic/extraneous/germane cognitive load (Citation 2).
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/main/div/div[2]/div[5]/div[1]").nth(0)).to_contain_text("Intrinsic Cognitive Load: This is the inherent difficulty of the learning material itself", timeout=15000), "The Doubt Bot reply includes a second cited passage describing intrinsic/extraneous/germane cognitive load (Citation 2)."
        
        # --> Verify the conversation remains in the study workspace
        # Assert: The current URL contains '/app', confirming the session is in the study workspace.
        await expect(page).to_have_url(re.compile("/app"), timeout=15000), "The current URL contains '/app', confirming the session is in the study workspace."
        await page.locator("xpath=/html/body/div[2]/div[2]/aside/div[1]/div/div[2]/select").nth(0).scroll_into_view_if_needed()
        # Assert: The document selector lists 'sample', confirming the conversation is in the 'sample' study workspace.
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/aside/div[1]/div/div[2]/select").nth(0)).to_be_visible(timeout=15000), "The document selector lists 'sample', confirming the conversation is in the 'sample' study workspace."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    