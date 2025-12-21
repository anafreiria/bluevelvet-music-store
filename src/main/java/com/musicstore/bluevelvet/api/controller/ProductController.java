package com.musicstore.bluevelvet.api.controller;

import com.musicstore.bluevelvet.api.request.ProductRequest;
import com.musicstore.bluevelvet.api.response.ProductResponse;
import com.musicstore.bluevelvet.domain.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Log4j2
@RestController
@RequiredArgsConstructor
@RequestMapping("/products")
public class ProductController {

    private final ProductService service;

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getAllProducts(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProductById(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@RequestBody ProductRequest request){
        return ResponseEntity.ok(service.createProduct(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProductById(@PathVariable Long id, @RequestBody ProductRequest request) {
        return ResponseEntity.ok(service.updateProduct(id, request));
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<ProductResponse> uploadProductImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(service.updateProductImage(id, file));
    }

    // --- NOVO: Endpoint para imagens extras ---
    @PostMapping("/{id}/images")
    public ResponseEntity<ProductResponse> uploadAdditionalImages(@PathVariable Long id, @RequestParam("files") List<MultipartFile> files) {
        log.info("Recebendo {} imagens adicionais para o produto {}", files.size(), id);
        return ResponseEntity.ok(service.addAdditionalImages(id, files));
    }
}