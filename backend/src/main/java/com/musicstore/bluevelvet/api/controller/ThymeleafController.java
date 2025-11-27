package com.musicstore.bluevelvet.api.controller;

import com.musicstore.bluevelvet.api.request.ProductRequest;
import com.musicstore.bluevelvet.api.response.ProductResponse;
import com.musicstore.bluevelvet.domain.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
@RequiredArgsConstructor
public class ThymeleafController {

    private final ProductService service;

    @GetMapping("/")
    public String getHomePage() {
        return "index";
    }

    @GetMapping("/product/{id}")
    public String getProductView(@PathVariable("id") Long id, Model model) {
        ProductResponse response = service.findById(id);
        model.addAttribute("product", response);
        return "view-product";
    }

    @GetMapping("/product")
    public String showCreateProductForm(Model model) {
        model.addAttribute("product", new ProductRequest());
        return "create-product";
    }

    @PostMapping("/product")
    public String createProduct(@ModelAttribute ProductRequest request) {
        ProductResponse response = service.createProduct(request);
        return "redirect:/product/%d".formatted(response.getId());
    }

}
