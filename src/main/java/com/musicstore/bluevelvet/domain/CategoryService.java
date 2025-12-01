package com.musicstore.bluevelvet.domain;

import com.musicstore.bluevelvet.api.request.CategoryRequest;
import com.musicstore.bluevelvet.api.response.CategoryResponse;
import com.musicstore.bluevelvet.domain.exception.CategoryNotFoundException;
import com.musicstore.bluevelvet.infrastructure.CategoryRepository;
import com.musicstore.bluevelvet.infrastructure.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;
@Log4j2
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository repository;
    private final ProductRepository productRepository;


    public CategoryResponse create(CategoryRequest request) {
        Category parentCategory = null;
        if (request.getParentCategoryId() != null) {
            parentCategory = repository.findById(request.getParentCategoryId())
                    .orElseThrow(() -> new CategoryNotFoundException(
                            "Parent category not found with id %d".formatted(request.getParentCategoryId())));
        }

        Category category = new Category(request.getName(), request.getDescription(), parentCategory);
        Category saved = repository.save(category);

        return CategoryResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .parentCategoryId(parentCategory != null ? parentCategory.getId() : null)
                .build();
    }

    public List<CategoryResponse> listAll() {
        return repository.findAll().stream()
                .map(category -> CategoryResponse.builder()
                        .id(category.getId())
                        .name(category.getName())
                        .description(category.getDescription())
                        .parentCategoryId(category.getParentCategory() != null ? category.getParentCategory().getId() : null)
                        .build())
                .collect(Collectors.toList());
    }

    // Método para listar categorias com paginação e ordenação
    public Page<Category> listPaginated(int page, String sort) {

        // Define tamanho da página (5 itens por página)
        Pageable pageable = PageRequest.of(page, 5);

        // Verifica se a ordenação é descendente
        if ("desc".equalsIgnoreCase(sort)) {
            return repository.findAllTopLevelSortedDesc(pageable);
        }

        // Caso contrário, ordenação ascendente
        return repository.findAllTopLevelSortedAsc(pageable);
    }

    //Método para deletar categorias
    public void delete(Long id) {
        // 1. Primeiro buscamos a categoria pelo ID para saber qual é o NOME dela
        Category category = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada"));

        // 2. Agora perguntamos ao ProductRepository usando o NOME (String)
        // Note que usamos .existsByCategory (o método novo) e passamos .getName()
        if (productRepository.existsByCategory(category.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Não é possível excluir: Existem produtos vinculados a esta categoria.");
        }

        // 3. Se não tem produtos com esse nome, pode apagar
        repository.deleteById(id);
    }
}

