package com.musicstore.bluevelvet.api;

import com.musicstore.bluevelvet.api.request.CategoryRequest;
import com.musicstore.bluevelvet.domain.Category;
import com.musicstore.bluevelvet.domain.CategoryService;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@Controller
@RequestMapping("/categories")
public class CategoryController {

    private final CategoryService service;

    public CategoryController(CategoryService service) {
        this.service = service;
    }

    // Apenas usuários com ROLE_ADMIN ou ROLE_EDITOR podem acessar esta página
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    @GetMapping

    public String listCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "asc") String sort,
            Model model) {

        // Obtém categorias paginadas e ordenadas
        Page<Category> categories = service.listPaginated(page, sort);

        // Passa informações para o Thymeleaf
        model.addAttribute("categoriesPage", categories);
        model.addAttribute("currentPage", page);
        model.addAttribute("sort", sort);

        // Retorna a página list.html
        return "categories/list";
    }

    // Exibir formulário de edição
    @PreAuthorize("hasRole('ADMIN')") // Apenas Admin pode editar
    @GetMapping("/edit/{id}")
    public String showEditForm(@PathVariable Long id, Model model) {
        Category category = service.findById(id);

        model.addAttribute("category", category);
        model.addAttribute("listCategories", service.listAll());

        return "categories/edit";
    }

    // Processar a edição
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/edit/{id}")
    public String updateCategory(@PathVariable Long id,
                                 @ModelAttribute CategoryRequest categoryRequest) throws IOException {
        service.update(id, categoryRequest);
        return "redirect:/categories";
    }

}
