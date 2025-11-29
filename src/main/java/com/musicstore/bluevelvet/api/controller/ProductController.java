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

@Log4j2
@RestController
@RequiredArgsConstructor
@RequestMapping("/products")
public class ProductController {

    private final ProductService service;

    @GetMapping("/{id}")
    @Operation(summary = "Fetch product by id", description = "Fetch a product from the Blue Velvet Music Store")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        log.info("Request received to fetch a product by id {}", id);

        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping
    @Operation(summary = "Get all products", description = "Get all products from the Blue Velvet Music Store")
    public ResponseEntity<Page<ProductResponse>> getAllProducts(Pageable pageable) {
        log.info("Request received to fetch all products");

        return ResponseEntity.ok(service.findAll(pageable));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete product by id", description = "Delete a product from the Blue Velvet Music Store")
    public ResponseEntity<Void> deleteProductById(@PathVariable Long id) {
        log.info("Request received to delete a product by id {}", id);

        service.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    @PostMapping
    @Operation(summary = "Create a new product", description = "Create a product for the Blue Velvet Music Store")
    public ResponseEntity<ProductResponse> createProduct(@RequestBody ProductRequest request){
        log.info("Request received to create a new product. The request is {}", request);

        return ResponseEntity.ok(service.createProduct(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a product", description = "Update a product from the Blue Velvet Music Store")
    public ResponseEntity<ProductResponse> updateProductById(@PathVariable Long id, @RequestBody ProductRequest request) {
        log.info("Request received to update the product with id {} with the request {}", id, request);

        return ResponseEntity.ok(service.updateProduct(id, request));
    }

}
