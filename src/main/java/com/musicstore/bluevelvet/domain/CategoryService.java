package com.musicstore.bluevelvet.domain;

import com.musicstore.bluevelvet.api.request.CategoryRequest;
import com.musicstore.bluevelvet.api.response.CategoryResponse;
import com.musicstore.bluevelvet.domain.exception.CategoryNotFoundException;
import com.musicstore.bluevelvet.infrastructure.CategoryRepository;
import com.musicstore.bluevelvet.infrastructure.repository.ProductRepository; // Importante
import com.musicstore.bluevelvet.infrastructure.entity.Product; // Importante
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository repository;
    private final ProductRepository productRepository; // Injeção nova
    private final Path rootLocation = Paths.get("user-images");

    // Construtor atualizado recebendo o ProductRepository
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

    public List<CategoryResponse> listAll() {
        return repository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public Page<Category> listPaginated(int page, String sort) {
        Pageable pageable = PageRequest.of(page, 5);
        if ("desc".equalsIgnoreCase(sort)) {
            return repository.findAllTopLevelSortedDesc(pageable);
        }
        return repository.findAllTopLevelSortedAsc(pageable);
    }

    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .parentCategoryId(category.getParentCategory() != null ? category.getParentCategory().getId() : null)
                .build();
    }
}