import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        pw = await async_api.async_playwright().start()

        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        context = await browser.new_context()
        context.set_default_timeout(15000)
        page = await context.new_page()

        # -> Navigate to landing page
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass

        # -> Click the 'Acknowledge Policy' button to dismiss privacy modal
        elem = page.get_by_role('button', name='Acknowledge Policy', exact=True)
        await elem.click(timeout=10000)

        # -> Navigate directly to the app workspace
        await page.goto("http://localhost:3000/app")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass

        # -> Type a grounded study question and submit
        chat_input = page.get_by_placeholder('Ask any complex academic question here...', exact=True)
        await chat_input.wait_for(state="visible", timeout=10000)
        await chat_input.fill('What is the main argument of the uploaded document? Include page citations (e.g. "Page 1").')
        await chat_input.press("Enter")

        # Wait for the AI response to load
        await asyncio.sleep(5)

        # --> Assertions to verify final state

        # --> Verify the Study Timer tab is visible in the workspace navigation
        timer_tab = page.get_by_role('button', name='Study Timer', exact=True)
        await expect(timer_tab).to_be_visible(timeout=15000)

        # --> Verify the workspace URL is /app
        current_url = await page.evaluate("() => window.location.href")
        assert "/app" in current_url, f"Expected URL to contain /app, got: {current_url}"

        # --> Verify chat input is still visible (workspace active after sending message)
        await expect(chat_input).to_be_visible(timeout=10000)

        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())