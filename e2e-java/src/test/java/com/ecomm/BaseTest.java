package com.ecomm;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;

public abstract class BaseTest {

  protected static final String BASE_URL = "https://ecomm-ci-cd.netlify.app";

  private static Playwright playwright;
  private static Browser browser;
  protected BrowserContext context;
  protected Page page;

  @BeforeAll
  static void startBrowser() {
    playwright = Playwright.create();
    browser = playwright.chromium().launch(
        new BrowserType.LaunchOptions().setHeadless(true)
    );
  }

  @AfterAll
  static void stopBrowser() {
    if (browser != null) {
      browser.close();
    }
    if (playwright != null) {
      playwright.close();
    }
  }

  @BeforeEach
  void openPage() {
    context = browser.newContext();
    page = context.newPage();
  }

  @AfterEach
  void closePage() {
    if (context != null) {
      context.close();
    }
  }
}
