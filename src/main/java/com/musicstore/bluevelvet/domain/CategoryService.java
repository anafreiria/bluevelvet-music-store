package com.musicstore.bluevelvet.domain;

import com.musicstore.bluevelvet.api.request.CategoryRequest;
import com.musicstore.bluevelvet.api.response.CategoryResponse;
import com.musicstore.bluevelvet.domain.exception.CategoryNotFoundException;
import com.musicstore.bluevelvet.infrastructure.CategoryRepository;
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

    // Diretório onde as imagens serão salvas (pode configurar no application.properties depois)
    private final Path rootLocation = Paths.get("user-images");

    public CategoryService(CategoryRepository repository) {
        this.repository = repository;
        initDirectory(); // Cria a pasta ao iniciar se não existir
    }

    private void initDirectory() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    // Metodo para preencher o formulario de edicao
    public Category findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found: " + id));
    }

    public void update(Long id, CategoryRequest request) throws IOException {
        Category existingCategory = findById(id);

        // Atualiza campos básicos
        existingCategory.setName(request.getName());
        existingCategory.setDescription(request.getDescription());
        existingCategory.setEnabled(request.isEnabled());

        // Atualiza Categoria Pai
        if (request.getParentCategoryId() != null) {
            Category parent = findById(request.getParentCategoryId());
            existingCategory.setParentCategory(parent);
        } else {
            existingCategory.setParentCategory(null);
        }

        MultipartFile newImage = request.getImageFile();
        if (newImage != null && !newImage.isEmpty()) {
            // 1. Deleta a imagem antiga se existir
            if (existingCategory.getImage() != null) {
                Path oldFile = rootLocation.resolve(existingCategory.getImage());
                Files.deleteIfExists(oldFile);
            }

            // 2. Salva a nova imagem
            String fileName = System.currentTimeMillis() + "_" + newImage.getOriginalFilename();
            Files.copy(newImage.getInputStream(), this.rootLocation.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

            // 3. Atualiza o nome no banco
            existingCategory.setImage(fileName);
        }
        // Se newImage for vazia, mantemos a existingCategory.getImage() atual (conforme requisito)

        repository.save(existingCategory);
    }

    public CategoryResponse create(CategoryRequest request) {
        Category parentCategory = null;
        if (request.getParentCategoryId() != null) {
            parentCategory = repository.findById(request.getParentCategoryId())
                    .orElseThrow(() -> new CategoryNotFoundException(
                            "Parent category not found with id %d".formatted(request.getParentCategoryId())));
        }

        Category category = new Category(request.getName(), request.getDescription(), parentCategory, null);
        Category saved = repository.save(category);

        return null;
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
}
