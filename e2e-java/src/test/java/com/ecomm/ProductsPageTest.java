package com.ecomm;

import com.microsoft.playwright.options.AriaRole;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class ProductsPageTest extends BaseTest {

  @Test
  void productsPageListsCatalog() {
    page.navigate(BASE_URL + "/products");

    page.getByPlaceholder("Search products").waitFor();
    page.getByRole(AriaRole.HEADING).first().waitFor();

    assertTrue(page.title().contains("Products"), "Title should mention Products");
    assertTrue(
        page.getByRole(AriaRole.HEADING).count() > 0,
        "At least one product heading should be listed"
    );
    assertTrue(
        page.getByText("Page").first().isVisible(),
        "Pagination text should be visible"
    );
  }
}
