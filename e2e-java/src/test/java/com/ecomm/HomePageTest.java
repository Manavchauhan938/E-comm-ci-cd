package com.ecomm;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class HomePageTest extends BaseTest {

  @Test
  void homePageLoadsOnNetlify() {
    page.navigate(BASE_URL + "/");

    page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("E-Comm").setExact(true))
        .first()
        .waitFor();

    assertTrue(page.title().contains("E-Comm"), "Page title should contain E-Comm");

    var shopNow = page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Shop now"));
    shopNow.waitFor();
    assertTrue(shopNow.isVisible(), "Shop now link should be visible");

    var heading = page.getByRole(
        AriaRole.HEADING,
        new Page.GetByRoleOptions().setName("Commerce that feels effortless")
    );
    heading.waitFor();
    assertTrue(heading.isVisible(), "Hero heading should be visible");
  }
}
