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

        # -> Wait for workspace to load
        await asyncio.sleep(2)

        # -> Send first grounded question
        chat_input = page.get_by_placeholder('Ask any complex academic question here...', exact=True)
        await chat_input.wait_for(state="visible", timeout=10000)
        await chat_input.fill("What is classical conditioning?")
        await chat_input.press("Enter")

        # Wait for first response
        await asyncio.sleep(5)

        # -> Send follow-up question
        await chat_input.wait_for(state="visible", timeout=10000)
        await chat_input.fill("Can you give me a real-world example?")
        await chat_input.press("Enter")

        # Wait for second response
        await asyncio.sleep(5)

        # --> Assertions to verify final state

        # --> Assert: URL is still /app (conversation stayed in workspace)
        current_url = await page.evaluate("() => window.location.href")
        assert "/app" in current_url, f"Expected workspace URL to contain /app after follow-up, got: {current_url}"

        # --> Assert: Chat input is still visible (workspace remains active)
        await expect(chat_input).to_be_visible(timeout=10000)

        await asyncio.sleep(2)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())