package com.musicstore.bluevelvet.api;

import com.musicstore.bluevelvet.domain.Category;
import com.musicstore.bluevelvet.domain.CategoryService;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
// Importação necessária (se estiver usando Spring Security)
import org.springframework.security.access.prepost.PreAuthorize;

@Controller
public class CategoryController {

    private final CategoryService service;

    public CategoryController(CategoryService service) {
        this.service = service;
    }

    // ADICIONADO: Restringe o acesso à rota /categories para ADMIN ou EDITOR
    @PreAuthorize("hasAnyAuthority('ADMIN', 'EDITOR')")
    @GetMapping("/categories")
    public String listCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "ASC") String sort,
            Model model) {

        Page<Category> categories = service.listCategories(page, sort);

        model.addAttribute("categories", categories);
        model.addAttribute("sort", sort);

        return "categories/list";
    }
}