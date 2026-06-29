import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def test():
    pw = await async_api.async_playwright().start()
    browser = await pw.chromium.launch(
        headless=True,
        args=["--window-size=1280,720", "--disable-dev-shm-usage", "--ipc=host", "--single-process"]
    )
    context = await browser.new_context()
    context.set_default_timeout(15000)
    page = await context.new_page()

    async def handle_route(route, request):
        if "listPapers" in request.url:
            await route.fulfill(
                status=200,
                content_type="application/json",
                body='{"papers": [{"id": "p1", "title": "Test", "filename": "test.pdf", "file_path": "/k/test.pdf"}]}'
            )
        else:
            await route.continue_()

    await page.route("**/api/lemma**", handle_route)
    try:
        await page.goto("http://localhost:3000/app")
        await page.wait_for_load_state("domcontentloaded", timeout=5000)
    except Exception as e:
        print("goto error:", e)

    url = page.url
    print("URL:", url)

    await context.close()
    await browser.close()
    await pw.stop()
    print("PASS")

asyncio.run(test())
