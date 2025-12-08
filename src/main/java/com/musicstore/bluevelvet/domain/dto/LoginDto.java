package com.musicstore.bluevelvet.domain.dto;

public class LoginDto {
    private String email;
    private String password;

    // Getters e Setters são obrigatórios para o Jackson (JSON) funcionar
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
