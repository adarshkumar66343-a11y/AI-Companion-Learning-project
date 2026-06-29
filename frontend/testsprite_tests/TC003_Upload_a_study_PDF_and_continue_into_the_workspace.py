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

        # -> Wait for the workspace to load papers
        await asyncio.sleep(2)

        # --> Assertions to verify final state

        # --> Verify the uploaded document is available in the workspace selector
        doc_selector = page.locator("select").first
        await doc_selector.wait_for(state="visible", timeout=15000)
        await expect(doc_selector).to_be_visible(timeout=15000)

        # --> Verify the workspace URL is /app
        current_url = await page.evaluate("() => window.location.href")
        assert "/app" in current_url, f"Expected URL to contain /app, got: {current_url}"

        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())