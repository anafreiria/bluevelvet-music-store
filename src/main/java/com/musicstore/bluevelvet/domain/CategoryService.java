package com.musicstore.bluevelvet.domain;

import com.musicstore.bluevelvet.api.request.CategoryRequest;
import com.musicstore.bluevelvet.api.response.CategoryResponse;
import com.musicstore.bluevelvet.domain.exception.CategoryNotFoundException;
import com.musicstore.bluevelvet.infrastructure.CategoryRepository;
import com.musicstore.bluevelvet.infrastructure.repository.ProductRepository;
import com.musicstore.bluevelvet.infrastructure.entity.Product;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.stream.Collectors;

@Log4j2
@Service
public class CategoryService {

    private final CategoryRepository repository;
    private final ProductRepository productRepository;
    private final Path rootLocation = Paths.get("user-images");

    public CategoryService(CategoryRepository repository, ProductRepository productRepository) {
        this.repository = repository;
        this.productRepository = productRepository;
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    public CategoryResponse create(CategoryRequest request) {
        return saveOrUpdate(null, request);
    }

    public CategoryResponse update(Long id, CategoryRequest request) {
        return saveOrUpdate(id, request);
    }

    private CategoryResponse saveOrUpdate(Long id, CategoryRequest request) {
        Category category;
        String oldName = null; // Para guardar o nome antigo

        if (id != null) {
            category = repository.findById(id)
                    .orElseThrow(() -> new CategoryNotFoundException("Category not found: " + id));
            oldName = category.getName(); // Guarda o nome antes de mudar
        } else {
            category = new Category();
        }

        // Atualiza os dados da categoria
        category.setName(request.getName());
        category.setDescription(request.getDescription());

        if (request.getEnabled() != null) {
            category.setEnabled(request.getEnabled());
        }

        if (request.getParentCategoryId() != null) {
            Category parent = repository.findById(request.getParentCategoryId())
                    .orElseThrow(() -> new CategoryNotFoundException("Parent not found: " + request.getParentCategoryId()));
            category.setParentCategory(parent);
        } else {
            category.setParentCategory(null);
        }

        // Lógica da Imagem
        MultipartFile imageFile = request.getImageFile();
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                if (category.getImage() != null) {
                    Files.deleteIfExists(this.rootLocation.resolve(category.getImage()));
                }
                String filename = System.currentTimeMillis() + "_" + imageFile.getOriginalFilename();
                Files.copy(imageFile.getInputStream(), this.rootLocation.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
                category.setImage(filename);
            } catch (IOException e) {
                throw new RuntimeException("Failed to store file", e);
            }
        }

        // Salva a Categoria
        Category saved = repository.save(category);

        // --- LÓGICA NOVA: Atualizar Produtos ---
        // Se for uma edição e o nome mudou, atualiza todos os produtos que tinham o nome antigo
        if (id != null && oldName != null && !oldName.equals(request.getName())) {
            List<Product> productsToUpdate = productRepository.findByCategory(oldName);
            for (Product p : productsToUpdate) {
                p.setCategory(request.getName()); // Muda para o novo nome
            }
            productRepository.saveAll(productsToUpdate); // Salva todos os produtos
        }
        // ---------------------------------------

        return mapToResponse(saved);
    }

    // Métodos de listagem (Mantenha igual)
    public CategoryResponse findById(Long id) {
        Category category = repository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found: " + id));
        return mapToResponse(category);
    }

    public List<CategoryResponse> listAllResponses() {
        return repository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public Page<Category> listPaginated(int page, String sort) {
        return listPaginated(page, 5, sort);
    }

    public Page<Category> listPaginated(int page, int size, String sort) {
        Pageable pageable = PageRequest.of(page, size);
        if ("desc".equalsIgnoreCase(sort)) {
            return repository.findAllTopLevelSortedDesc(pageable);
        }
        return repository.findAllTopLevelSortedAsc(pageable);
    }

    public Page<CategoryResponse> listPaginatedResponses(int page, int size, String sort) {
        return listPaginated(page, size, sort).map(this::mapToResponse);
    }

    public void delete(Long id) {
        Category category = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found: " + id));

        if (productRepository.existsByCategory(category.getName())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Não é possível excluir: existem produtos vinculados a esta categoria."
            );
        }

        if (category.getImage() != null) {
            try {
                Files.deleteIfExists(this.rootLocation.resolve(category.getImage()));
            } catch (IOException e) {
                log.warn("Failed to delete stored image {} for category {}", category.getImage(), category.getId(), e);
            }
        }

        repository.deleteById(id);
    }

    private CategoryResponse mapToResponse(Category category) {
        String imagePath = category.getImage() != null
                ? "/user-images/" + category.getImage()
                : null;
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .image(imagePath).enabled(category.getEnabled())
                .parentCategoryId(category.getParentCategory() != null ? category.getParentCategory().getId() : null)
                .build();
    }
}
