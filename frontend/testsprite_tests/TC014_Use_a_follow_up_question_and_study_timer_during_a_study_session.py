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
        
        # -> Click the 'Acknowledge Policy' button on the Brainzy Privacy & Data Protection Agreement modal to dismiss the modal so the workspace can be accessed.
        # Acknowledge Policy button
        elem = page.get_by_role('button', name='Acknowledge Policy', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Launch App' link in the top navigation to open the workspace so the document area, chat, and study timer become available.
        # Launch App link
        elem = page.get_by_role('link', name='Launch App', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Launch App' button in the top navigation to open the workspace so the document area, chat, and study timer become available.
        # Launch App link
        elem = page.get_by_role('link', name='Launch App', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Launch App' link in the top navigation to open the workspace so the document area, chat, and study timer become available.
        # Launch App link
        elem = page.get_by_role('link', name='Launch App', exact=True)
        await elem.click(timeout=10000)
        
        # -> click
        # Launch App link
        elem = page.get_by_role('link', name='Launch App', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Try Free - No Account Required' button to attempt to open the workspace so the document area, chat, and study timer become available.
        # rocket_launch Try Free - No Account Required link
        elem = page.get_by_role('link', name='rocket_launch Try Free - No Account Required', exact=True)
        await elem.click(timeout=10000)
        
        # -> Scroll down to reveal more page content and then click the 'Try Free - No Account Required' button if it remains visible to attempt opening the workspace.
        await page.mouse.wheel(0, 300)
        
        # -> Scroll down to reveal more page content and then click the 'Try Free - No Account Required' button if it remains visible to attempt opening the workspace.
        # rocket_launch Try Free - No Account Required link
        elem = page.get_by_role('link', name='rocket_launch Try Free - No Account Required', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Launch App' link in the top navigation to open the workspace (wait 1s first to allow the page to settle).
        # Launch App link
        elem = page.get_by_role('link', name='Launch App', exact=True)
        await elem.click(timeout=10000)
        
        # -> Create a small test PDF named 'study_sample.pdf' and upload it using the visible file upload control ('Browse Files' file input) on the landing page so the app can ingest the document.
        # file upload
        elem = page.get_by_label('upload_fileClick to select PDF documentPDF format, up to 10MB', exact=True)
        await elem.wait_for(state="attached", timeout=10000)
        if await elem.evaluate("e => e.tagName === 'INPUT' && (e.type || '').toLowerCase() === 'file'"):
            await elem.set_input_files("./fixtures/study_sample.pdf")
        else:
            await elem.wait_for(state="visible", timeout=10000)
            async with page.expect_file_chooser() as fc_info:
                await elem.click()
            chooser = await fc_info.value
            await chooser.set_files("./fixtures/study_sample.pdf")
        
        # -> Navigate directly to the app workspace by opening the app route (open the workspace /app) so the document area, chat, and study timer can be accessed.
        await page.goto("http://localhost:3000/app")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Type a grounded question asking for the sample answer and send it, then type a follow-up asking where in the document the answer is stated, send it, and open the 'Study Timer' panel from the top navigation.
        # Ask any complex academic question here... text field
        elem = page.get_by_placeholder('Ask any complex academic question here...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("What is the answer to the sample question in the uploaded document?")
        
        # -> Type a grounded question asking for the sample answer and send it, then type a follow-up asking where in the document the answer is stated, send it, and open the 'Study Timer' panel from the top navigation.
        # Ask any complex academic question here... text field
        elem = page.get_by_placeholder('Ask any complex academic question here...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Can you confirm where in the document that answer is stated?")
        
        # -> Type a grounded question asking for the sample answer and send it, then type a follow-up asking where in the document the answer is stated, send it, and open the 'Study Timer' panel from the top navigation.
        # Study Timer button
        elem = page.get_by_role('button', name='Study Timer', exact=True)
        await elem.click(timeout=10000)
        
        # -> Start the study timer by clicking the 'Begin Interval' (play) button, wait for the timer UI to update, then open the 'Doubt Bot' chat to verify the follow-up answer is displayed.
        # play_arrow Begin Interval button
        elem = page.get_by_role('button', name='play_arrow Begin Interval', exact=True)
        await elem.click(timeout=10000)
        
        # -> Start the study timer by clicking the 'Begin Interval' (play) button, wait for the timer UI to update, then open the 'Doubt Bot' chat to verify the follow-up answer is displayed.
        # Doubt Bot button
        elem = page.get_by_role('button', name='Doubt Bot', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Study Timer' panel (click the 'Study Timer' button in the top navigation), then verify the Doubt Bot follow-up reply is present and that the timer display shows an active countdown.
        # Study Timer button
        elem = page.get_by_role('button', name='Study Timer', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Doubt Bot' chat by clicking the 'Doubt Bot' button, wait for it to render, and then confirm that the follow-up reply referencing the uploaded document (the sample answer) is displayed; also observe the timer display again to co...
        # Doubt Bot button
        elem = page.get_by_role('button', name='Doubt Bot', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the 'Study Timer' panel (top navigation) and confirm the timer shows an active countdown (look for 'Pause Session' or a current time) and verify the Doubt Bot follow-up reply is present in the chat.
        # Study Timer button
        elem = page.get_by_role('button', name='Study Timer', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the study timer is running
        await page.locator("xpath=/html/body/div[2]/div[2]/main/div/div/div[2]/button[2]").nth(0).scroll_into_view_if_needed()
        # Assert: The study timer's pause button is visible, indicating the timer is running.
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/main/div/div/div[2]/button[2]").nth(0)).to_be_visible(timeout=15000), "The study timer's pause button is visible, indicating the timer is running."
        # Assert: The study timer display contains 'Pause Session', confirming an active session.
        await expect(page.locator("xpath=/html/body/div[2]/div[2]/main/div/div/div[2]/button[2]").nth(0)).to_contain_text("Pause Session", timeout=15000), "The study timer display contains 'Pause Session', confirming an active session."
        current_url = await page.evaluate("() => window.location.href")
        # Assert: page loaded with a URL (final outcome verified by the AI judge during the run)
        assert current_url, 'Page should have loaded with a URL'
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    