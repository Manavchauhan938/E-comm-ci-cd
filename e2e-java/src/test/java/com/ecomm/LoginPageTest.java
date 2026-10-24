package com.ecomm;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class LoginPageTest extends BaseTest {

  @Test
  void customerCanSignIn() {
    page.navigate(BASE_URL + "/login");

    page.getByRole(AriaRole.HEADING, new Page.GetByRoleOptions().setName("Sign in")).waitFor();
    page.getByLabel("Email").fill("customer@ecomm.local");
    page.getByLabel("Password").fill("Customer123!");
    page.locator("form button[type='submit']").click();

    var logout = page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Log out"));
    logout.waitFor();
    assertTrue(logout.isVisible(), "Signed-in user should see Log out");
  }
}
