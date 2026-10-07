package com.carrental.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "email_verification_otps")
public class EmailVerificationOtp {

    @Id
    private String id;

    @Indexed
    private String email;

    private String otpCode;

    private boolean verified;

    private Date expiresAt;

    @CreatedDate
    private Date createdAt;
}
