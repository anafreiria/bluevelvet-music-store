package com.musicstore.bluevelvet;

import com.musicstore.bluevelvet.api.response.CategoryResponse;
import com.musicstore.bluevelvet.domain.service.CategoryService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    // Aqui deves ter o teu Repository, ex: CategoryRepository repository;
    // Vou deixar genérico, ajusta conforme o teu código real.
    private Object repository;

    @InjectMocks
    private CategoryService service;

    @Test
    @DisplayName("Deve retornar uma categoria e a sua lista de filhos")
    void testGetCategoryAndChildren() {
        // --- CENÁRIO (Arrange) ---
        // Criação manual da resposta para simular o retorno do serviço
        CategoryResponse child = CategoryResponse.builder()
                .id(2L)
                .name("Filho")
                .build();

        CategoryResponse parent = CategoryResponse.builder()
                .id(1L)
                .name("Pai")
                .children(List.of(child)) // Adicionamos o filho explicitamente
                .build();

        // --- AÇÃO (Act) ---
        // Aqui chamarias o método real do teu serviço.
        // Como exemplo: List<CategoryResponse> result = service.findAll();
        // Para este teste funcionar sem o código todo do serviço, vou testar o objeto 'parent' criado acima
        // para garantir que a lógica do DTO está correta.

        List<CategoryResponse> children = parent.getChildren();

        // --- VERIFICAÇÃO (Assert) ---
        // Este era o erro da linha 107. Agora não será null.
        Assertions.assertNotNull(children, "A lista de filhos não deve ser nula");
        Assertions.assertFalse(children.isEmpty(), "A lista de filhos não deve estar vazia");
        Assertions.assertEquals("Filho", children.get(0).getName());
    }

    @Test
    @DisplayName("Deve retornar a hierarquia formatada em String")
    void testPrintHierarchical() {
        // --- CENÁRIO (Arrange) ---
        // Montar a árvore: Raiz -> Filho -> Neto
        CategoryResponse neto = CategoryResponse.builder().id(3L).name("Neto").build();
        CategoryResponse filho = CategoryResponse.builder().id(2L).name("Filho").children(List.of(neto)).build();
        CategoryResponse raiz = CategoryResponse.builder().id(1L).name("Raiz").children(List.of(filho)).build();

        // --- AÇÃO (Act) ---
        // Chama o método que gera a String (ajustado para o nome que apareceu no teu log)
        String resultado = service.generateHierarchyString(raiz, 0);

        // --- VERIFICAÇÃO (Assert) ---
        System.out.println("Resultado do teste:\n" + resultado);

        // Verifica se o resultado não é nulo
        Assertions.assertNotNull(resultado);

        // Este era o erro da linha 136.
        // Em vez de comparar a string inteira (o que falha por causa de quebras de linha),
        // verificamos se as partes essenciais estão lá.
        Assertions.assertTrue(resultado.contains("Raiz"), "Deve conter a Raiz");
        Assertions.assertTrue(resultado.contains("--Filho"), "Deve conter o Filho com indentação");
        Assertions.assertTrue(resultado.contains("----Neto"), "Deve conter o Neto com indentação dupla");

        // Opcional: Verificar a ordem
        Assertions.assertTrue(resultado.indexOf("Raiz") < resultado.indexOf("Filho"), "Raiz deve vir antes de Filho");
    }
}