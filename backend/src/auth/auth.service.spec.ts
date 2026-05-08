import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";

jest.mock("bcrypt");

describe("AuthService", () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaService>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService) as DeepMockProxy<PrismaService>;
    jwtService = module.get(JwtService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateUser", () => {
    it("should return user data without password when credentials are valid", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser("test@example.com", "password");

      expect(result).toEqual({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        avatar: null,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password",
        "hashedPassword",
      );
    });

    it("should return null when user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser("test@example.com", "password");

      expect(result).toBeNull();
    });

    it("should return null when password is invalid", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser("test@example.com", "password");

      expect(result).toBeNull();
    });
  });

  describe("login", () => {
    it("should return access token and user data", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
      };

      jest.spyOn(jwtService, "sign").mockReturnValue("mockToken");

      const result = await service.login(mockUser);

      expect(result).toEqual({
        access_token: "mockToken",
        user: {
          id: 1,
          email: "test@example.com",
          name: "Test User",
        },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: "test@example.com",
        sub: 1,
      });
    });
  });

  describe("register", () => {
    it("should create a new user when email not exists", async () => {
      const registerDto = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      const createdUser = {
        id: 1,
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
      prisma.user.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        avatar: null,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          password: "hashedPassword",
          name: "Test User",
          avatar: undefined,
        },
      });
    });

    it("should throw ConflictException when email already exists", async () => {
      const registerDto = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("getProfile", () => {
    it("should return user profile", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.getProfile(1);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it("should throw UnauthorizedException when user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(UnauthorizedException);
    });
  });
});
