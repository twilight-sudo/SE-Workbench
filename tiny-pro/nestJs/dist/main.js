/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const common_1 = __webpack_require__(3);
const user_module_1 = __webpack_require__(4);
const db_1 = __webpack_require__(34);
const permission_module_1 = __webpack_require__(37);
const auth_module_1 = __webpack_require__(42);
const core_1 = __webpack_require__(1);
const auth_guard_1 = __webpack_require__(47);
const permission_guard_1 = __webpack_require__(49);
const role_module_1 = __webpack_require__(50);
const path_1 = __webpack_require__(56);
const fs_1 = __webpack_require__(57);
const user_service_1 = __webpack_require__(5);
const role_service_1 = __webpack_require__(51);
const permission_service_1 = __webpack_require__(38);
const menu_service_1 = __webpack_require__(52);
const menu_module_1 = __webpack_require__(58);
const config_1 = __webpack_require__(62);
const menuData_1 = __webpack_require__(63);
const i18_module_1 = __webpack_require__(64);
const lang_service_1 = __webpack_require__(69);
const i18_service_1 = __webpack_require__(65);
const nestjs_i18n_1 = __webpack_require__(20);
const mock_module_1 = __webpack_require__(72);
const reject_guard_1 = __webpack_require__(85);
let AppModule = exports.AppModule = class AppModule {
    constructor(user, role, permission, menu, lang, i18) {
        this.user = user;
        this.role = role;
        this.permission = permission;
        this.menu = menu;
        this.lang = lang;
        this.i18 = i18;
    }
    async onModuleInit() {
        const ROOT = __dirname;
        const data = (0, path_1.join)(ROOT, 'data');
        if (!(0, fs_1.existsSync)(data)) {
            (0, fs_1.mkdirSync)(data);
        }
        const LOCK_FILE = (0, path_1.join)(data, 'lock');
        if ((0, fs_1.existsSync)(LOCK_FILE)) {
            common_1.Logger.warn('Lock file exists, if you want init agin, please remove dist or dist/lock');
            return;
        }
        const I18_INIT_FILE_PATH = (0, path_1.join)(process.cwd(), 'locales.json');
        const I18_INIT_FILE = JSON.parse((0, fs_1.readFileSync)(I18_INIT_FILE_PATH).toString());
        const dbLangNames = (await this.lang.findAll()).map((lang) => lang.name);
        const langs = Object.keys(I18_INIT_FILE).filter((key) => !dbLangNames.includes(key));
        for (const name of langs) {
            const { id } = await this.lang.create({ name });
            for (const [key, value] of Object.entries(I18_INIT_FILE[name])) {
                const dbValue = await this.i18.has(key, id);
                if (dbValue) {
                    common_1.Logger.warn(`${name} - ${key} exists value is ${dbValue.content}`);
                    continue;
                }
                common_1.Logger.log(`${name} - ${key} not exists`);
                await this.i18.create({ key, content: value, lang: id });
                common_1.Logger.log(`${name} - ${key} save success`);
            }
        }
        const permissions = {
            user: ['add', 'remove', 'update', 'query', 'password::force-update'],
            permission: ['add', 'remove', 'update', 'get'],
            role: ['add', 'remove', 'update', 'query'],
            menu: ['add', 'remove', 'update', 'query'],
            i18n: ['add', 'remove', 'update', 'query'],
            lang: ['add', 'remove', 'update', 'query'],
        };
        const tasks = [];
        let permission;
        const isInit = true;
        try {
            permission = await this.permission.create({
                name: '*',
                desc: 'super permission',
            }, isInit);
        }
        catch (e) {
            const err = e;
            common_1.Logger.error(err.message);
            common_1.Logger.error(`Please clear the database and try again`);
            process.exit(-1);
        }
        for (const [module, actions] of Object.entries(permissions)) {
            for (const action of actions) {
                tasks.push(this.permission.create({
                    name: `${module}::${action}`,
                    desc: '',
                }, isInit));
            }
        }
        try {
            for (const item of menuData_1.menuData) {
                await this.menu.createMenu(item, isInit);
            }
        }
        catch (e) {
            const err = e;
            common_1.Logger.error(err.message);
            common_1.Logger.error(`Please clear the database and try again`);
            process.exit(-1);
        }
        const status = Promise.allSettled(tasks);
        const statusData = await status;
        const hasFail = statusData.some((data) => data.status === 'rejected');
        if (hasFail) {
            const fail = statusData.filter((data) => data.status === 'rejected');
            fail.forEach((data) => {
                common_1.Logger.error(`${data.reason}`);
            });
            common_1.Logger.error('Please clear the database and try again');
            process.exit(-1);
        }
        const menuId = this.menu.getMenuAllId();
        const role = await this.role.create({
            name: 'admin',
            permissionIds: [permission.id],
            menuIds: await menuId,
        }, isInit);
        const user = await this.user.create({
            email: 'admin@no-reply.com',
            password: 'admin',
            roleIds: [role.id],
            name: 'admin',
            status: 1,
        }, isInit);
        common_1.Logger.log(`[APP]: create admin user success`);
        common_1.Logger.log(`[APP]: email: ${user.email}`);
        common_1.Logger.log(`[APP]: password: 'admin'`);
        common_1.Logger.log('Enjoy!');
        (0, fs_1.writeFileSync)(LOCK_FILE, '');
    }
};
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            db_1.DbModule,
            user_module_1.UserModule,
            permission_module_1.PermissionModule,
            auth_module_1.AuthModule,
            role_module_1.RoleModule,
            menu_module_1.MenuModule,
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            i18_module_1.I18Module,
            nestjs_i18n_1.I18nModule.forRoot({
                fallbackLanguage: 'enUS',
                loaderOptions: {
                    path: (0, path_1.join)(__dirname, '/i18n/'),
                    watch: true,
                },
                resolvers: [new nestjs_i18n_1.HeaderResolver(['x-lang'])],
                typesOutputPath: (0, path_1.join)(__dirname, '../src/.generate/i18n.generated.ts'),
            }),
            mock_module_1.MockModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: auth_guard_1.AuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: reject_guard_1.RejectRequestGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: permission_guard_1.PermissionGuard,
            },
        ],
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof user_service_1.UserService !== "undefined" && user_service_1.UserService) === "function" ? _a : Object, typeof (_b = typeof role_service_1.RoleService !== "undefined" && role_service_1.RoleService) === "function" ? _b : Object, typeof (_c = typeof permission_service_1.PermissionService !== "undefined" && permission_service_1.PermissionService) === "function" ? _c : Object, typeof (_d = typeof menu_service_1.MenuService !== "undefined" && menu_service_1.MenuService) === "function" ? _d : Object, typeof (_e = typeof lang_service_1.I18LangService !== "undefined" && lang_service_1.I18LangService) === "function" ? _e : Object, typeof (_f = typeof i18_service_1.I18Service !== "undefined" && i18_service_1.I18Service) === "function" ? _f : Object])
], AppModule);


/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 4 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserModule = void 0;
const common_1 = __webpack_require__(3);
const user_service_1 = __webpack_require__(5);
const user_controller_1 = __webpack_require__(23);
const models_1 = __webpack_require__(7);
const typeorm_1 = __webpack_require__(6);
const auth_service_1 = __webpack_require__(16);
const redis_service_1 = __webpack_require__(18);
let UserModule = exports.UserModule = class UserModule {
};
exports.UserModule = UserModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([models_1.User, models_1.Permission, models_1.Role])],
        controllers: [user_controller_1.UserController],
        providers: [user_service_1.UserService, auth_service_1.AuthService, redis_service_1.RedisService],
        exports: [user_service_1.UserService],
    })
], UserModule);


/***/ }),
/* 5 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserService = void 0;
const common_1 = __webpack_require__(3);
const typeorm_1 = __webpack_require__(6);
const models_1 = __webpack_require__(7);
const typeorm_2 = __webpack_require__(9);
const crypto = __webpack_require__(13);
const auth_service_1 = __webpack_require__(16);
const nestjs_typeorm_paginate_1 = __webpack_require__(21);
const process = __webpack_require__(22);
const nestjs_i18n_1 = __webpack_require__(20);
let UserService = exports.UserService = class UserService {
    constructor(userRep, roleRep, authService, i18n) {
        this.userRep = userRep;
        this.roleRep = roleRep;
        this.authService = authService;
        this.i18n = i18n;
    }
    async create(createUserDto, isInit) {
        const { email, password, roleIds = [], name, department, employeeType, probationStart, probationEnd, probationDuration, protocolStart, protocolEnd, address, status, } = createUserDto;
        const userInfo = this.getUserInfo(email);
        if (isInit == true && (await userInfo)) {
            return userInfo;
        }
        if (await userInfo) {
            throw new common_1.HttpException(this.i18n.translate('exception.user.userExists', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.BAD_REQUEST);
        }
        const roles = this.roleRep.find({
            where: {
                id: (0, typeorm_2.In)(roleIds),
            },
        });
        try {
            const user = this.userRep.create({
                email,
                password,
                name: name,
                role: await roles,
                department: department,
                employeeType: employeeType,
                protocolStart: protocolStart,
                protocolEnd: protocolEnd,
                probationEnd: probationEnd,
                probationStart: probationStart,
                probationDuration: probationDuration,
                address: address,
                status: status,
            });
            return this.userRep.save(user);
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAllUser(paginationQuery, name, role, email) {
        const { page, limit } = paginationQuery;
        const relations = ['role', 'role.permission'];
        const result = await (0, nestjs_typeorm_paginate_1.paginate)(this.userRep, {
            page: Number(page) || Number(process.env.PAGITION_PAGE),
            limit: Number(limit) || Number(process.env.PAGITION_LIMIT),
        }, {
            select: [
                'id',
                'name',
                'email',
                'department',
                'employeeType',
                'protocolStart',
                'protocolEnd',
                'probationEnd',
                'probationStart',
                'probationDuration',
                'address',
                'status',
            ],
            relations,
            where: {
                name: name ? (0, typeorm_2.Like)(name) : undefined,
                role: role && role.length
                    ? {
                        id: (0, typeorm_2.In)(role),
                    }
                    : undefined,
                email: email ? (0, typeorm_2.Like)(email) : undefined,
            },
        });
        for (const user of result.items) {
            if (user.probationStart !== null) {
                user.probationStart = await this.formatDateToDay(new Date(user.probationStart));
            }
            if (user.probationEnd !== null) {
                user.probationEnd = await this.formatDateToDay(new Date(user.probationEnd));
            }
            if (user.protocolStart !== null) {
                user.protocolStart = await this.formatDateToDay(new Date(user.protocolStart));
            }
            if (user.protocolEnd !== null) {
                user.protocolEnd = await this.formatDateToDay(new Date(user.protocolEnd));
            }
        }
        return result;
    }
    async formatDateToDay(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    async getUserInfo(email, relations = []) {
        const user = await this.userRep.findOne({
            where: { email },
            select: [
                'id',
                'name',
                'email',
                'department',
                'employeeType',
                'protocolStart',
                'protocolEnd',
                'probationEnd',
                'probationStart',
                'probationDuration',
                'address',
                'status',
            ],
            relations,
        });
        if (user) {
            if (user.probationStart !== null) {
                user.probationStart = await this.formatDateToDay(new Date(user.probationStart));
            }
            if (user.probationEnd !== null) {
                user.probationEnd = await this.formatDateToDay(new Date(user.probationEnd));
            }
            if (user.protocolStart !== null) {
                user.protocolStart = await this.formatDateToDay(new Date(user.protocolStart));
            }
            if (user.protocolEnd !== null) {
                user.protocolEnd = await this.formatDateToDay(new Date(user.protocolEnd));
            }
        }
        return user;
    }
    async getUserPermission(token, userInfo) {
        const { email } = userInfo;
        const { role } = (await this.getUserInfo(email, [
            'role',
            'role.permission',
        ])) ?? { role: [] };
        const permission = role.flatMap((r) => r.permission);
        const permissionNames = permission.map((p) => p.name);
        return [...new Set([...permissionNames])];
    }
    async verifyPassword(password, storedHash, salt) {
        const newHash = crypto
            .pbkdf2Sync(password, salt, 1000, 18, 'sha256')
            .toString('hex');
        return newHash === storedHash;
    }
    async encry(value, salt) {
        return crypto.pbkdf2Sync(value, salt, 1000, 18, 'sha256').toString('hex');
    }
    async deleteUser(email) {
        const allUser = await this.userRep.find();
        if (allUser.length > 1) {
            const user = await this.userRep.findOne({
                where: { email },
            });
            if (!user) {
                return;
            }
            await this.authService.kickOut(email);
            return this.userRep.remove(user);
        }
        throw new common_1.HttpException(this.i18n.translate('exception.user.userNumberNull', {
            lang: nestjs_i18n_1.I18nContext.current().lang,
        }), common_1.HttpStatus.BAD_REQUEST);
    }
    async updatePwdUser(data) {
        const { email, newPassword, oldPassword, token } = data;
        const user = this.userRep.findOne({
            where: { email },
            select: ['id', 'name', 'email', 'salt', 'password'],
        });
        if (user) {
            if (!(await this.verifyPassword(oldPassword, (await user).password, (await user).salt))) {
                throw new common_1.HttpException(this.i18n.translate('exception.user.oldPasswordError', {
                    lang: nestjs_i18n_1.I18nContext.current().lang,
                }), common_1.HttpStatus.BAD_REQUEST);
            }
            else {
                (await user).password = await this.encry(newPassword, (await user).salt);
                await this.userRep.save(await user);
                await this.authService.kickOut((await user).email);
                return;
            }
        }
    }
    async updatePwdAdmin(data) {
        const { email, newPassword } = data;
        const user = this.userRep.findOne({
            where: { email },
            select: ['id', 'name', 'email', 'salt', 'password'],
        });
        if (user) {
            (await user).password = await this.encry(newPassword, (await user).salt);
            await this.userRep.save(await user);
            await this.authService.kickOut((await user).email);
            return;
        }
    }
    async updateUserInfo(updateUserDto) {
        const { email, roleIds, department, employeeType, probationStart, probationEnd, probationDuration, protocolStart, protocolEnd, address, status, name, } = updateUserDto;
        const user = this.getUserInfo(email, ['role']);
        const roles = this.roleRep.find({
            where: {
                id: (0, typeorm_2.In)(roleIds),
            },
        });
        const userRoles = (await user).role.map((role) => role.id).join('');
        if (user) {
            (await user).name = name;
            (await user).department = department;
            (await user).employeeType = employeeType;
            (await user).probationStart = probationStart;
            (await user).probationEnd = probationEnd;
            (await user).probationDuration = probationDuration;
            (await user).protocolStart = protocolStart;
            (await user).protocolEnd = protocolEnd;
            (await user).address = address;
            (await user).status = status;
            (await user).role = await roles;
        }
        const newProfile = await this.userRep.save(await user);
        if (userRoles !== roleIds.join('')) {
            await this.authService.kickOut(email);
        }
        return newProfile;
    }
};
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(models_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(models_1.Role)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof auth_service_1.AuthService !== "undefined" && auth_service_1.AuthService) === "function" ? _c : Object, typeof (_d = typeof nestjs_i18n_1.I18nService !== "undefined" && nestjs_i18n_1.I18nService) === "function" ? _d : Object])
], UserService);


/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("@nestjs/typeorm");

/***/ }),
/* 7 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(8), exports);
__exportStar(__webpack_require__(11), exports);
__exportStar(__webpack_require__(10), exports);
__exportStar(__webpack_require__(12), exports);
__exportStar(__webpack_require__(14), exports);
__exportStar(__webpack_require__(15), exports);


/***/ }),
/* 8 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.User = exports.encry = void 0;
const typeorm_1 = __webpack_require__(9);
const role_1 = __webpack_require__(10);
const crypto = __webpack_require__(13);
const encry = (value, salt) => crypto.pbkdf2Sync(value, salt, 1000, 18, 'sha256').toString('hex');
exports.encry = encry;
let User = exports.User = class User {
    beforeInsert() {
        this.salt = crypto.randomBytes(4).toString('base64');
        this.password = (0, exports.encry)(this.password, this.salt);
    }
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => role_1.Role),
    (0, typeorm_1.JoinTable)({ name: 'user_role' }),
    __metadata("design:type", Array)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "employeeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "probationStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "probationEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "probationDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "protocolStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "protocolEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], User.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], User.prototype, "createTime", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], User.prototype, "updateTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], User.prototype, "create_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "salt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], User.prototype, "update_time", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], User.prototype, "beforeInsert", null);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('user')
], User);


/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = require("typeorm");

/***/ }),
/* 10 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Role = void 0;
const typeorm_1 = __webpack_require__(9);
const permission_1 = __webpack_require__(11);
const menu_1 = __webpack_require__(12);
let Role = exports.Role = class Role {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Role.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Role.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => permission_1.Permission, {
        onUpdate: 'CASCADE',
    }),
    (0, typeorm_1.JoinTable)({ name: 'role_permission' }),
    __metadata("design:type", Array)
], Role.prototype, "permission", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => menu_1.Menu),
    (0, typeorm_1.JoinTable)({ name: 'role_menu' }),
    __metadata("design:type", Array)
], Role.prototype, "menus", void 0);
exports.Role = Role = __decorate([
    (0, typeorm_1.Entity)('role')
], Role);


/***/ }),
/* 11 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Permission = void 0;
const typeorm_1 = __webpack_require__(9);
let Permission = exports.Permission = class Permission {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Permission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Permission.prototype, "desc", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Permission.prototype, "name", void 0);
exports.Permission = Permission = __decorate([
    (0, typeorm_1.Entity)('permission')
], Permission);


/***/ }),
/* 12 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Menu = void 0;
const typeorm_1 = __webpack_require__(9);
let Menu = exports.Menu = class Menu {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Menu.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Menu.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Menu.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Menu.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Menu.prototype, "menuType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Menu.prototype, "icon", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Menu.prototype, "component", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Menu.prototype, "path", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Menu.prototype, "locale", void 0);
exports.Menu = Menu = __decorate([
    (0, typeorm_1.Entity)('menu')
], Menu);


/***/ }),
/* 13 */
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),
/* 14 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.I18 = void 0;
const typeorm_1 = __webpack_require__(9);
const lang_1 = __webpack_require__(15);
let I18 = exports.I18 = class I18 {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], I18.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lang_1.Lang),
    __metadata("design:type", typeof (_a = typeof lang_1.Lang !== "undefined" && lang_1.Lang) === "function" ? _a : Object)
], I18.prototype, "lang", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], I18.prototype, "key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'longtext' }),
    __metadata("design:type", String)
], I18.prototype, "content", void 0);
exports.I18 = I18 = __decorate([
    (0, typeorm_1.Entity)('i18')
], I18);


/***/ }),
/* 15 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Lang = void 0;
const typeorm_1 = __webpack_require__(9);
const i18n_1 = __webpack_require__(14);
let Lang = exports.Lang = class Lang {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Lang.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Lang.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => i18n_1.I18, (i18) => i18.lang),
    __metadata("design:type", Array)
], Lang.prototype, "i18", void 0);
exports.Lang = Lang = __decorate([
    (0, typeorm_1.Entity)()
], Lang);


/***/ }),
/* 16 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthService = void 0;
const common_1 = __webpack_require__(3);
const typeorm_1 = __webpack_require__(6);
const models_1 = __webpack_require__(7);
const typeorm_2 = __webpack_require__(9);
const jwt_1 = __webpack_require__(17);
const redis_service_1 = __webpack_require__(18);
const nestjs_i18n_1 = __webpack_require__(20);
let AuthService = exports.AuthService = class AuthService {
    constructor(user, jwtService, redisService, i18n) {
        this.user = user;
        this.jwtService = jwtService;
        this.redisService = redisService;
        this.i18n = i18n;
    }
    async getToken(userId) {
        return this.redisService.getUserToken(`user:${userId}:token`);
    }
    async kickOut(email) {
        await this.redisService.delUserToken(`user:${email}:token`);
    }
    async logout(token) {
        const decoded = await this.jwtService.verify(token);
        await this.redisService.delUserToken(`user:${decoded.email}:token`);
        return;
    }
    async login(dto) {
        const { email, password } = dto;
        const userInfo = await this.user.findOne({ where: { email } });
        if (userInfo === null) {
            throw new common_1.HttpException(this.i18n.translate('exception.auth.userNotExists', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.NOT_FOUND);
        }
        if ((0, models_1.encry)(password, userInfo.salt) !== userInfo.password) {
            throw new common_1.HttpException(this.i18n.translate('exception.auth.passwordOrEmailError', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.BAD_REQUEST);
        }
        const payload = {
            email,
        };
        const token = this.jwtService.signAsync(payload);
        await this.redisService.setUserToken(`user:${email}:token`, await token, await parseInt(process.env.REDIS_SECONDS));
        return {
            token: await token,
        };
    }
};
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(models_1.User)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _b : Object, typeof (_c = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _c : Object, typeof (_d = typeof nestjs_i18n_1.I18nService !== "undefined" && nestjs_i18n_1.I18nService) === "function" ? _d : Object])
], AuthService);


/***/ }),
/* 17 */
/***/ ((module) => {

module.exports = require("@nestjs/jwt");

/***/ }),
/* 18 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisService = void 0;
const common_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(19);
let RedisService = exports.RedisService = class RedisService {
    constructor() {
        this.redisClient = new ioredis_1.default({
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
        });
    }
    async setUserToken(email, token, ttl) {
        return this.redisClient.set(`user:${email}:token`, token, 'EX', ttl);
    }
    async getUserToken(email) {
        return this.redisClient.get(`user:${email}:token`);
    }
    async delUserToken(email) {
        await this.redisClient.del(`user:${email}:token`);
        return;
    }
};
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisService);


/***/ }),
/* 19 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 20 */
/***/ ((module) => {

module.exports = require("nestjs-i18n");

/***/ }),
/* 21 */
/***/ ((module) => {

module.exports = require("nestjs-typeorm-paginate");

/***/ }),
/* 22 */
/***/ ((module) => {

module.exports = require("process");

/***/ }),
/* 23 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserController = void 0;
const common_1 = __webpack_require__(3);
const user_service_1 = __webpack_require__(5);
const create_user_dto_1 = __webpack_require__(24);
const permission_decorator_1 = __webpack_require__(26);
const update_user_dto_1 = __webpack_require__(27);
const pagination_query_dto_1 = __webpack_require__(29);
const update_pwd_admin_dto_1 = __webpack_require__(31);
const update_pwd_user_dto_1 = __webpack_require__(32);
const nestjs_i18n_1 = __webpack_require__(20);
const reject_decorator_1 = __webpack_require__(33);
let UserController = exports.UserController = class UserController {
    constructor(userService) {
        this.userService = userService;
    }
    async register(body) {
        return this.userService.create(body, false);
    }
    async getUserInfo(i18n, request, email) {
        const _email = email ? email : request.user.email;
        if (!_email) {
            throw new common_1.HttpException(i18n.t('exception.common.unauth', { lang: nestjs_i18n_1.I18nContext.current().lang }), common_1.HttpStatus.UNAUTHORIZED);
        }
        return this.userService.getUserInfo(_email, ['role', 'role.permission']);
    }
    async delUser(email) {
        return this.userService.deleteUser(email);
    }
    async UpdateUser(body) {
        return this.userService.updateUserInfo(body);
    }
    async getAllUser(paginationQuery, name, role, email) {
        return this.userService.getAllUser(paginationQuery, name, role, email);
    }
    async updatePwdAdmin(body) {
        return this.userService.updatePwdAdmin(body);
    }
    async updatePwdUser(body) {
        return this.userService.updatePwdUser(body);
    }
};
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, common_1.Post)('reg'),
    (0, permission_decorator_1.Permission)('user::add'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_user_dto_1.CreateUserDto !== "undefined" && create_user_dto_1.CreateUserDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "register", null);
__decorate([
    (0, common_1.Get)('/info/:email?'),
    __param(0, (0, nestjs_i18n_1.I18n)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof nestjs_i18n_1.I18nContext !== "undefined" && nestjs_i18n_1.I18nContext) === "function" ? _c : Object, Object, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserInfo", null);
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, common_1.Delete)('/:email'),
    (0, permission_decorator_1.Permission)('user::remove'),
    __param(0, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "delUser", null);
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, common_1.Patch)('/update'),
    (0, permission_decorator_1.Permission)('user::update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof update_user_dto_1.UpdateUserDto !== "undefined" && update_user_dto_1.UpdateUserDto) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "UpdateUser", null);
__decorate([
    (0, common_1.Get)(),
    (0, permission_decorator_1.Permission)('user::query'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('name')),
    __param(2, (0, common_1.Query)('role', new common_1.DefaultValuePipe([]), common_1.ParseArrayPipe)),
    __param(3, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof pagination_query_dto_1.PaginationQueryDto !== "undefined" && pagination_query_dto_1.PaginationQueryDto) === "function" ? _g : Object, String, Array, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getAllUser", null);
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, common_1.Patch)('/admin/updatePwd'),
    (0, permission_decorator_1.Permission)('user::password::force-update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof update_pwd_admin_dto_1.UpdatePwdAdminDto !== "undefined" && update_pwd_admin_dto_1.UpdatePwdAdminDto) === "function" ? _h : Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updatePwdAdmin", null);
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, common_1.Patch)('/updatePwd'),
    (0, permission_decorator_1.Permission)('user::update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof update_pwd_user_dto_1.UpdatePwdUserDto !== "undefined" && update_pwd_user_dto_1.UpdatePwdUserDto) === "function" ? _j : Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updatePwdUser", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [typeof (_a = typeof user_service_1.UserService !== "undefined" && user_service_1.UserService) === "function" ? _a : Object])
], UserController);


/***/ }),
/* 24 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateUserDto = void 0;
const class_validator_1 = __webpack_require__(25);
const nestjs_i18n_1 = __webpack_require__(20);
class CreateUserDto {
    constructor() {
        this.roleIds = [];
    }
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);


/***/ }),
/* 25 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Permission = exports.PERMISSION_KEYS = void 0;
const common_1 = __webpack_require__(3);
exports.PERMISSION_KEYS = 'permissions';
const Permission = (...permissions) => (0, common_1.SetMetadata)(exports.PERMISSION_KEYS, permissions);
exports.Permission = Permission;


/***/ }),
/* 27 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateUserDto = void 0;
const mapped_types_1 = __webpack_require__(28);
const create_user_dto_1 = __webpack_require__(24);
const class_validator_1 = __webpack_require__(25);
const nestjs_i18n_1 = __webpack_require__(20);
class UpdateUserDto extends (0, mapped_types_1.PartialType)(create_user_dto_1.CreateUserDto) {
    constructor() {
        super(...arguments);
        this.roleIds = [];
    }
}
exports.UpdateUserDto = UpdateUserDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", Array)
], UpdateUserDto.prototype, "roleIds", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "employeeType", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "probationStart", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "probationEnd", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "probationDuration", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "protocolStart", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "protocolEnd", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", Number)
], UpdateUserDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "name", void 0);


/***/ }),
/* 28 */
/***/ ((module) => {

module.exports = require("@nestjs/mapped-types");

/***/ }),
/* 29 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PaginationQueryDto = void 0;
const class_validator_1 = __webpack_require__(25);
const class_transformer_1 = __webpack_require__(30);
const process = __webpack_require__(22);
class PaginationQueryDto {
    constructor() {
        this.page = Number(process.env.PAGITION_PAGE);
        this.limit = Number(process.env.PAGITION_PAGE);
    }
}
exports.PaginationQueryDto = PaginationQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(value => isNaN(Number(value)) ? 1 : Number(value)),
    __metadata("design:type", Number)
], PaginationQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(value => isNaN(Number(value)) ? 10 : Number(value)),
    __metadata("design:type", Number)
], PaginationQueryDto.prototype, "limit", void 0);


/***/ }),
/* 30 */
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),
/* 31 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdatePwdAdminDto = void 0;
const mapped_types_1 = __webpack_require__(28);
const create_user_dto_1 = __webpack_require__(24);
const class_validator_1 = __webpack_require__(25);
const nestjs_i18n_1 = __webpack_require__(20);
class UpdatePwdAdminDto extends (0, mapped_types_1.PartialType)(create_user_dto_1.CreateUserDto) {
}
exports.UpdatePwdAdminDto = UpdatePwdAdminDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], UpdatePwdAdminDto.prototype, "newPassword", void 0);


/***/ }),
/* 32 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdatePwdUserDto = void 0;
const mapped_types_1 = __webpack_require__(28);
const create_user_dto_1 = __webpack_require__(24);
const class_validator_1 = __webpack_require__(25);
const nestjs_i18n_1 = __webpack_require__(20);
class UpdatePwdUserDto extends (0, mapped_types_1.PartialType)(create_user_dto_1.CreateUserDto) {
}
exports.UpdatePwdUserDto = UpdatePwdUserDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], UpdatePwdUserDto.prototype, "newPassword", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], UpdatePwdUserDto.prototype, "oldPassword", void 0);


/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Reject = void 0;
const common_1 = __webpack_require__(3);
const Reject = () => (0, common_1.SetMetadata)('reject', true);
exports.Reject = Reject;


/***/ }),
/* 34 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(35), exports);
__exportStar(__webpack_require__(36), exports);


/***/ }),
/* 35 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DbModule = void 0;
const common_1 = __webpack_require__(3);
const db_service_1 = __webpack_require__(36);
const typeorm_1 = __webpack_require__(6);
let DbModule = exports.DbModule = class DbModule {
};
exports.DbModule = DbModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                useClass: db_service_1.DbService,
            }),
        ],
        providers: [db_service_1.DbService],
        exports: [db_service_1.DbService],
    })
], DbModule);


/***/ }),
/* 36 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DbService = void 0;
const common_1 = __webpack_require__(3);
let DbService = exports.DbService = class DbService {
    constructor() { }
    createTypeOrmOptions() {
        return {
            type: 'mysql',
            host: process.env.DATABASE_HOST,
            port: parseInt(process.env.DATABASE_PORT),
            username: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
            autoLoadEntities: process.env.DATABASE_AUTOLOADENTITIES === 'true',
        };
    }
};
exports.DbService = DbService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DbService);


/***/ }),
/* 37 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PermissionModule = void 0;
const common_1 = __webpack_require__(3);
const permission_service_1 = __webpack_require__(38);
const permission_controller_1 = __webpack_require__(39);
const typeorm_1 = __webpack_require__(6);
const models_1 = __webpack_require__(7);
let PermissionModule = exports.PermissionModule = class PermissionModule {
};
exports.PermissionModule = PermissionModule = __decorate([
    (0, common_1.Module)({
        controllers: [permission_controller_1.PermissionController],
        providers: [permission_service_1.PermissionService],
        imports: [typeorm_1.TypeOrmModule.forFeature([models_1.Permission])],
        exports: [permission_service_1.PermissionService],
    })
], PermissionModule);


/***/ }),
/* 38 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PermissionService = void 0;
const common_1 = __webpack_require__(3);
const typeorm_1 = __webpack_require__(6);
const models_1 = __webpack_require__(7);
const typeorm_2 = __webpack_require__(9);
const nestjs_i18n_1 = __webpack_require__(20);
const nestjs_typeorm_paginate_1 = __webpack_require__(21);
let PermissionService = exports.PermissionService = class PermissionService {
    constructor(permission, i18n) {
        this.permission = permission;
        this.i18n = i18n;
    }
    async create(createPermissionDto, isInit) {
        const { name, desc } = createPermissionDto;
        const permissionInfo = this.permission.findOne({
            where: { name },
        });
        if (isInit == true && (await permissionInfo)) {
            return permissionInfo;
        }
        if ((await permissionInfo) && isInit == false) {
            throw new common_1.HttpException(this.i18n.t('exception.permission.exists', {
                args: { name },
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.BAD_REQUEST);
        }
        const permission = await this.permission.save({ name, desc });
        return permission;
    }
    async updatePermission(dto) {
        const { name, desc, id } = dto;
        const permissionInfo = await this.permission.findOne({
            where: { id },
        });
        if (!permissionInfo) {
            throw new common_1.HttpException(this.i18n.t('exception.permission.notExists', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.NOT_FOUND);
        }
        return this.permission.update(id, { name, desc });
    }
    async findPermission(page, limit, name) {
        if (!limit) {
            return this.permission.find();
        }
        const count = await this.permission.count();
        return (0, nestjs_typeorm_paginate_1.paginate)(this.permission, {
            limit: limit ? limit : count,
            page,
        }, {
            where: {
                name: name ? (0, typeorm_2.Like)(name) : undefined,
            },
        });
    }
    async delPermission(id) {
        const permissionInfo = await this.permission.findOne({
            where: { id },
        });
        return this.permission.remove(permissionInfo);
    }
};
exports.PermissionService = PermissionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(models_1.Permission)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof nestjs_i18n_1.I18nService !== "undefined" && nestjs_i18n_1.I18nService) === "function" ? _b : Object])
], PermissionService);


/***/ }),
/* 39 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PermissionController = void 0;
const common_1 = __webpack_require__(3);
const permission_service_1 = __webpack_require__(38);
const create_permission_dto_1 = __webpack_require__(40);
const permission_decorator_1 = __webpack_require__(26);
const update_permission_dto_1 = __webpack_require__(41);
const reject_decorator_1 = __webpack_require__(33);
let PermissionController = exports.PermissionController = class PermissionController {
    constructor(permissionService) {
        this.permissionService = permissionService;
    }
    create(dto) {
        return this.permissionService.create(dto, false);
    }
    update(dto) {
        return this.permissionService.updatePermission(dto);
    }
    find(page, limit, name) {
        return this.permissionService.findPermission(page, limit, name);
    }
    del(id) {
        return this.permissionService.delPermission(id);
    }
};
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, permission_decorator_1.Permission)('permission::add'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_permission_dto_1.CreatePermissionDto !== "undefined" && create_permission_dto_1.CreatePermissionDto) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "create", null);
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, common_1.Patch)(),
    (0, permission_decorator_1.Permission)('permission::update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof update_permission_dto_1.UpdatePermissionDto !== "undefined" && update_permission_dto_1.UpdatePermissionDto) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(),
    (0, permission_decorator_1.Permission)('permission::get'),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe('1'), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe('0'), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "find", null);
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, common_1.Delete)('/:id'),
    (0, permission_decorator_1.Permission)('permission::remove'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "del", null);
exports.PermissionController = PermissionController = __decorate([
    (0, common_1.Controller)('permission'),
    __metadata("design:paramtypes", [typeof (_a = typeof permission_service_1.PermissionService !== "undefined" && permission_service_1.PermissionService) === "function" ? _a : Object])
], PermissionController);


/***/ }),
/* 40 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreatePermissionDto = void 0;
const class_validator_1 = __webpack_require__(25);
const nestjs_i18n_1 = __webpack_require__(20);
class CreatePermissionDto {
}
exports.CreatePermissionDto = CreatePermissionDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "desc", void 0);


/***/ }),
/* 41 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdatePermissionDto = void 0;
const mapped_types_1 = __webpack_require__(28);
const create_permission_dto_1 = __webpack_require__(40);
const class_validator_1 = __webpack_require__(25);
const nestjs_i18n_1 = __webpack_require__(20);
class UpdatePermissionDto extends (0, mapped_types_1.PartialType)(create_permission_dto_1.CreatePermissionDto) {
}
exports.UpdatePermissionDto = UpdatePermissionDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", Number)
], UpdatePermissionDto.prototype, "id", void 0);


/***/ }),
/* 42 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthModule = void 0;
const common_1 = __webpack_require__(3);
const auth_service_1 = __webpack_require__(16);
const auth_controller_1 = __webpack_require__(43);
const typeorm_1 = __webpack_require__(6);
const models_1 = __webpack_require__(7);
const jwt_1 = __webpack_require__(17);
const user_module_1 = __webpack_require__(4);
const redis_service_1 = __webpack_require__(18);
const redis_module_1 = __webpack_require__(48);
let AuthModule = exports.AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, redis_service_1.RedisService],
        exports: [auth_service_1.AuthService],
        imports: [
            typeorm_1.TypeOrmModule.forFeature([models_1.User]),
            jwt_1.JwtModule.registerAsync({
                imports: [redis_module_1.RedisModule],
                useFactory: async () => ({
                    secret: process.env.AUTH_SECRET,
                    global: true,
                    signOptions: {
                        expiresIn: process.env.EXPIRES_IN,
                    },
                }),
                global: true,
            }),
            user_module_1.UserModule,
        ],
    })
], AuthModule);


/***/ }),
/* 43 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthController = void 0;
const common_1 = __webpack_require__(3);
const auth_service_1 = __webpack_require__(16);
const create_auth_dto_1 = __webpack_require__(44);
const logout_auth_dto_1 = __webpack_require__(45);
const public_decorator_1 = __webpack_require__(46);
const auth_guard_1 = __webpack_require__(47);
let AuthController = exports.AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(body) {
        return this.authService.login(body);
    }
    async logout(body) {
        return this.authService.logout(body.token);
    }
};
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_auth_dto_1.CreateAuthDto !== "undefined" && create_auth_dto_1.CreateAuthDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof logout_auth_dto_1.LogoutAuthDto !== "undefined" && logout_auth_dto_1.LogoutAuthDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [typeof (_a = typeof auth_service_1.AuthService !== "undefined" && auth_service_1.AuthService) === "function" ? _a : Object])
], AuthController);


/***/ }),
/* 44 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateAuthDto = void 0;
const class_validator_1 = __webpack_require__(25);
const nestjs_i18n_1 = __webpack_require__(20);
class CreateAuthDto {
}
exports.CreateAuthDto = CreateAuthDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], CreateAuthDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], CreateAuthDto.prototype, "password", void 0);


/***/ }),
/* 45 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogoutAuthDto = void 0;
const class_validator_1 = __webpack_require__(25);
const nestjs_i18n_1 = __webpack_require__(20);
class LogoutAuthDto {
}
exports.LogoutAuthDto = LogoutAuthDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY_HUMAN', {
            name: 'Token',
        }),
    }),
    __metadata("design:type", String)
], LogoutAuthDto.prototype, "token", void 0);


/***/ }),
/* 46 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Public = void 0;
const common_1 = __webpack_require__(3);
const Public = () => (0, common_1.SetMetadata)('isPublic', true);
exports.Public = Public;


/***/ }),
/* 47 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthGuard = void 0;
const common_1 = __webpack_require__(3);
const core_1 = __webpack_require__(1);
const jwt_1 = __webpack_require__(17);
const auth_service_1 = __webpack_require__(16);
const nestjs_i18n_1 = __webpack_require__(20);
let AuthGuard = exports.AuthGuard = class AuthGuard {
    constructor(jwt, reflector, authService) {
        this.jwt = jwt;
        this.reflector = reflector;
        this.authService = authService;
    }
    async canActivate(ctx) {
        const i18n = nestjs_i18n_1.I18nContext.current();
        const isPublic = this.reflector.getAllAndOverride('isPublic', [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const req = ctx.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(req);
        if (!token) {
            throw new common_1.HttpException(i18n.t('exception.common.tokenError', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.UNAUTHORIZED);
        }
        try {
            await this.jwt.verify(token);
            const payload = await this.jwt.decode(token);
            req['user'] = payload;
            const cacheToken = await this.authService.getToken(payload.email);
            if (!cacheToken) {
                throw new common_1.HttpException(i18n.t('exception.common.tokenExpire', {
                    lang: nestjs_i18n_1.I18nContext.current().lang,
                }), common_1.HttpStatus.UNAUTHORIZED);
            }
            if (cacheToken !== token) {
                throw new common_1.HttpException(i18n.t('exception.common.tokenError', {
                    lang: nestjs_i18n_1.I18nContext.current().lang,
                }), common_1.HttpStatus.UNAUTHORIZED);
            }
            return true;
        }
        catch (err) {
            throw new common_1.HttpException(i18n.t('exception.common.tokenExpire', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.UNAUTHORIZED);
        }
    }
    extractTokenFromHeader(request) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
};
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _a : Object, typeof (_b = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _b : Object, typeof (_c = typeof auth_service_1.AuthService !== "undefined" && auth_service_1.AuthService) === "function" ? _c : Object])
], AuthGuard);


/***/ }),
/* 48 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisModule = void 0;
const common_1 = __webpack_require__(3);
const redis_service_1 = __webpack_require__(18);
let RedisModule = exports.RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule = __decorate([
    (0, common_1.Module)({
        providers: [redis_service_1.RedisService],
        exports: [redis_service_1.RedisService],
    })
], RedisModule);


/***/ }),
/* 49 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PermissionGuard = void 0;
const common_1 = __webpack_require__(3);
const core_1 = __webpack_require__(1);
const user_service_1 = __webpack_require__(5);
const permission_decorator_1 = __webpack_require__(26);
const nestjs_i18n_1 = __webpack_require__(20);
let PermissionGuard = exports.PermissionGuard = class PermissionGuard {
    constructor(reflector, userSerivce) {
        this.reflector = reflector;
        this.userSerivce = userSerivce;
    }
    async canActivate(ctx) {
        const i18n = nestjs_i18n_1.I18nContext.current();
        const req = ctx.switchToHttp().getRequest();
        const requiredPermission = this.reflector.getAllAndOverride(permission_decorator_1.PERMISSION_KEYS, [ctx.getClass(), ctx.getHandler()]);
        if (!requiredPermission || requiredPermission.length === 0) {
            return true;
        }
        const [, token] = (req.headers.authorization ?? '').split(' ') ?? ['', ''];
        const permissionNames = await this.userSerivce.getUserPermission(token, req.user);
        const isContainedPermission = requiredPermission.every((item) => permissionNames.includes(item));
        if (permissionNames.includes('*')) {
            return true;
        }
        if (!isContainedPermission) {
            throw new common_1.HttpException(i18n.t('exception.common.forbidden', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
                args: {
                    permission: requiredPermission.join(','),
                },
            }), common_1.HttpStatus.FORBIDDEN);
        }
        return true;
    }
};
exports.PermissionGuard = PermissionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _a : Object, typeof (_b = typeof user_service_1.UserService !== "undefined" && user_service_1.UserService) === "function" ? _b : Object])
], PermissionGuard);


/***/ }),
/* 50 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RoleModule = void 0;
const common_1 = __webpack_require__(3);
const role_service_1 = __webpack_require__(51);
const role_controller_1 = __webpack_require__(53);
const typeorm_1 = __webpack_require__(6);
const models_1 = __webpack_require__(7);
let RoleModule = exports.RoleModule = class RoleModule {
};
exports.RoleModule = RoleModule = __decorate([
    (0, common_1.Module)({
        controllers: [role_controller_1.RoleController],
        providers: [role_service_1.RoleService],
        imports: [typeorm_1.TypeOrmModule.forFeature([models_1.Role, models_1.Permission, models_1.Menu, models_1.User])],
        exports: [role_service_1.RoleService],
    })
], RoleModule);


/***/ }),
/* 51 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RoleService = void 0;
const common_1 = __webpack_require__(3);
const typeorm_1 = __webpack_require__(6);
const models_1 = __webpack_require__(7);
const typeorm_2 = __webpack_require__(9);
const menu_service_1 = __webpack_require__(52);
const nestjs_i18n_1 = __webpack_require__(20);
const nestjs_typeorm_paginate_1 = __webpack_require__(21);
let RoleService = exports.RoleService = class RoleService {
    constructor(role, permission, menu, user, i18n) {
        this.role = role;
        this.permission = permission;
        this.menu = menu;
        this.user = user;
        this.i18n = i18n;
    }
    async create(createRoleDto, isInit) {
        const { name, permissionIds = [], menuIds = [] } = createRoleDto;
        const roleInfo = this.role.findOne({
            where: {
                name,
            },
        });
        if (isInit == true && (await roleInfo)) {
            return roleInfo;
        }
        if (await roleInfo) {
            throw new common_1.HttpException(this.i18n.t('exception.role.exists', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.BAD_REQUEST);
        }
        const permissions = await this.permission.find({
            where: {
                id: (0, typeorm_2.In)(permissionIds),
            },
        });
        const menus = await this.menu.find({
            where: {
                id: (0, typeorm_2.In)(menuIds),
            },
        });
        return this.role.save({ name, permission: permissions, menus });
    }
    findAll() {
        return this.role.find();
    }
    async findAllDetail(page, limit, name) {
        const roleInfo = await (0, nestjs_typeorm_paginate_1.paginate)(this.role, {
            page,
            limit,
        }, {
            where: {
                name: name ? (0, typeorm_2.Like)(name) : undefined,
            },
            relations: ['permission', 'menus'],
        });
        const menuTree = [];
        for (const item of roleInfo.items) {
            menuTree.push((0, menu_service_1.convertToTree)(item.menus));
        }
        return {
            roleInfo,
            menuTree,
        };
    }
    async findOne(id) {
        const roleInfo = await this.role
            .createQueryBuilder('role')
            .leftJoinAndSelect('role.menus', 'menus')
            .leftJoinAndSelect('role.permission', 'permission')
            .where({
            id: parseInt(id),
        })
            .getOne();
        if (!roleInfo) {
            throw new common_1.HttpException(this.i18n.t('exception.role.notExists', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.NOT_FOUND);
        }
        return roleInfo;
    }
    async update(data) {
        const permission = await this.permission.find({
            where: {
                id: (0, typeorm_2.In)(data.permissionIds ?? []),
            },
        });
        const menus = await this.menu.find({
            where: {
                id: (0, typeorm_2.In)(data.menuIds ?? []),
            },
        });
        const { id, name } = data;
        const roleInfo = await this.role.find({
            where: {
                id: id,
            },
        });
        if (roleInfo.length === 0) {
            throw new common_1.HttpException(this.i18n.t('exception.role.notExists', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.BAD_REQUEST);
        }
        const role = roleInfo[0];
        role.name = name;
        if (data.permissionIds) {
            role.permission = permission;
        }
        if (data.menuIds) {
            role.menus = menus;
        }
        return this.role.save(role);
    }
    async delete(id) {
        const role = await this.role.find({
            where: {
                id: id,
            },
        });
        const user = await this.user.find({
            where: {
                role: {
                    id,
                },
            },
            take: 1,
        });
        if (user.length) {
            throw new common_1.HttpException(this.i18n.t('exception.role.conflict', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.CONFLICT);
        }
        return this.role.remove(role);
    }
};
exports.RoleService = RoleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(models_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(models_1.Permission)),
    __param(2, (0, typeorm_1.InjectRepository)(models_1.Menu)),
    __param(3, (0, typeorm_1.InjectRepository)(models_1.User)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _c : Object, typeof (_d = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _d : Object, typeof (_e = typeof nestjs_i18n_1.I18nService !== "undefined" && nestjs_i18n_1.I18nService) === "function" ? _e : Object])
], RoleService);


/***/ }),
/* 52 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MenuService = exports.convertToTree = void 0;
const common_1 = __webpack_require__(3);
const typeorm_1 = __webpack_require__(6);
const models_1 = __webpack_require__(7);
const typeorm_2 = __webpack_require__(9);
const nestjs_i18n_1 = __webpack_require__(20);
const toNode = (menu) => {
    return {
        label: menu.name,
        id: menu.id,
        children: [],
        url: menu.path,
        component: menu.component,
        customIcon: menu.icon,
        menuType: menu.menuType,
        parentId: menu.parentId,
        order: menu.order,
        locale: menu.locale,
    };
};
const convertToTree = (menus, parentId = null) => {
    const tree = [];
    for (let i = 0; i < menus.length; i++) {
        const menu = menus[i];
        if (menu.parentId === parentId) {
            const children = (0, exports.convertToTree)(menus, menu.id);
            const node = toNode(menu);
            node.children = children;
            tree.push(node);
        }
    }
    return tree;
};
exports.convertToTree = convertToTree;
let MenuService = exports.MenuService = class MenuService {
    constructor(user, menu, i18n) {
        this.user = user;
        this.menu = menu;
        this.i18n = i18n;
        this.menuId = [];
    }
    async findRoleMenu(email) {
        const userInfo = await this.user
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.role', 'role')
            .leftJoinAndSelect('role.menus', 'menus')
            .where({
            email: email,
        })
            .orderBy('menus.order', 'ASC')
            .getOne();
        const menus = userInfo.role.flatMap((role) => role.menus);
        const maps = {};
        menus.forEach((menu) => {
            maps[menu.id] = menu;
        });
        return (0, exports.convertToTree)(menus);
    }
    async findAllMenu() {
        const menu = this.menu.find();
        return (0, exports.convertToTree)(await menu);
    }
    async getMenuAllId() {
        const menu = await this.menu.find();
        for (const item of menu) {
            this.menuId.push(item.id);
        }
        await this.handleMenuParentId(this.menuId);
        return this.menuId;
    }
    async handleMenuParentId(menuId) {
        const menu = await this.menu.find();
        if (menu) {
            menu[1].parentId = menuId[0];
            menu[2].parentId = menuId[0];
            menu[4].parentId = menuId[3];
            menu[6].parentId = menuId[5];
            menu[7].parentId = menuId[5];
            menu[9].parentId = menuId[8];
            menu[11].parentId = menuId[10];
            menu[12].parentId = menuId[10];
            menu[14].parentId = menuId[13];
            menu[15].parentId = menuId[13];
            menu[16].parentId = menuId[13];
            menu[18].parentId = menuId[17];
            menu[20].parentId = menuId[19];
            menu[21].parentId = menuId[19];
            menu[23].parentId = menuId[22];
            menu[24].parentId = menuId[23];
            menu[26].parentId = menuId[25];
            menu[27].parentId = menuId[25];
            menu[28].parentId = menuId[25];
            menu[29].parentId = menuId[25];
            menu[30].parentId = menuId[25];
        }
        for (const item of menu) {
            await this.menu.update(item.id, { parentId: item.parentId });
        }
    }
    async createMenu(dto, isInit) {
        const { order, menuType, name, path, component, icon, parentId = null, locale, } = dto;
        const menuInfo = this.menu.findOne({
            where: { name, order, menuType, parentId, path, icon, component, locale },
        });
        if (isInit == true && (await menuInfo)) {
            return menuInfo;
        }
        if ((await menuInfo) && isInit == false) {
            throw new common_1.HttpException(this.i18n.t('exception.menu.exists', {
                args: { name },
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.BAD_REQUEST);
        }
        return this.menu.save({
            name,
            path,
            component,
            parentId,
            menuType,
            icon,
            order,
            locale,
        });
    }
    async updateMenu(newData) {
        await this.menu.update(newData.id, {
            name: newData.name,
            path: newData.path,
            component: newData.component,
            parentId: newData.parentId,
            menuType: newData.menuType,
            icon: newData.icon,
            order: newData.order,
            locale: newData.locale,
        });
        return true;
    }
    async deleteMenu(id, parentId) {
        const menu = this.menu.findOne({
            where: {
                id: id,
            },
        });
        const allMenu = await this.menu.find();
        for (const tmp of allMenu) {
            if (Number(tmp.parentId) === Number(id)) {
                if (Number(parentId) === -1) {
                    tmp.parentId = null;
                }
                else {
                    tmp.parentId = parentId;
                }
                await this.updateMenu(tmp);
            }
        }
        return this.menu.remove(await menu);
    }
};
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(models_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(models_1.Menu)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof nestjs_i18n_1.I18nService !== "undefined" && nestjs_i18n_1.I18nService) === "function" ? _c : Object])
], MenuService);


/***/ }),
/* 53 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RoleController = void 0;
const common_1 = __webpack_require__(3);
const role_service_1 = __webpack_require__(51);
const create_role_dto_1 = __webpack_require__(54);
const update_role_dto_1 = __webpack_require__(55);
const permission_decorator_1 = __webpack_require__(26);
const reject_decorator_1 = __webpack_require__(33);
let RoleController = exports.RoleController = class RoleController {
    constructor(roleService) {
        this.roleService = roleService;
    }
    create(createRoleDto) {
        return this.roleService.create(createRoleDto, false);
    }
    getAllRole() {
        return this.roleService.findAll();
    }
    getAllRoleDetail(page, limit, name) {
        return this.roleService.findAllDetail(page, limit, name);
    }
    updateRole(dto) {
        return this.roleService.update(dto);
    }
    deleteRole(id) {
        return this.roleService.delete(id);
    }
    getRoleInfo(id) {
        return this.roleService.findOne(id);
    }
};
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, permission_decorator_1.Permission)('role::add'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_role_dto_1.CreateRoleDto !== "undefined" && create_role_dto_1.CreateRoleDto) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], RoleController.prototype, "create", null);
__decorate([
    (0, permission_decorator_1.Permission)('role::query'),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RoleController.prototype, "getAllRole", null);
__decorate([
    (0, permission_decorator_1.Permission)('role::query'),
    (0, common_1.Get)('/detail'),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe('1'), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(process.env.PAGINATION_LIMIT), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", void 0)
], RoleController.prototype, "getAllRoleDetail", null);
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, common_1.Patch)(),
    (0, permission_decorator_1.Permission)('role::update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof update_role_dto_1.UpdateRoleDto !== "undefined" && update_role_dto_1.UpdateRoleDto) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], RoleController.prototype, "updateRole", null);
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, common_1.Delete)('/:id'),
    (0, permission_decorator_1.Permission)('role::remove'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RoleController.prototype, "deleteRole", null);
__decorate([
    (0, common_1.Get)('/info/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RoleController.prototype, "getRoleInfo", null);
exports.RoleController = RoleController = __decorate([
    (0, common_1.Controller)('role'),
    __metadata("design:paramtypes", [typeof (_a = typeof role_service_1.RoleService !== "undefined" && role_service_1.RoleService) === "function" ? _a : Object])
], RoleController);


/***/ }),
/* 54 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateRoleDto = void 0;
const class_validator_1 = __webpack_require__(25);
class CreateRoleDto {
}
exports.CreateRoleDto = CreateRoleDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], CreateRoleDto.prototype, "permissionIds", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], CreateRoleDto.prototype, "menuIds", void 0);


/***/ }),
/* 55 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateRoleDto = void 0;
const mapped_types_1 = __webpack_require__(28);
const create_role_dto_1 = __webpack_require__(54);
class UpdateRoleDto extends (0, mapped_types_1.PartialType)(create_role_dto_1.CreateRoleDto) {
}
exports.UpdateRoleDto = UpdateRoleDto;


/***/ }),
/* 56 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 57 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 58 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MenuModule = void 0;
const common_1 = __webpack_require__(3);
const menu_service_1 = __webpack_require__(52);
const menu_controller_1 = __webpack_require__(59);
const typeorm_1 = __webpack_require__(6);
const models_1 = __webpack_require__(7);
let MenuModule = exports.MenuModule = class MenuModule {
};
exports.MenuModule = MenuModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([models_1.Menu, models_1.User, models_1.Role])],
        controllers: [menu_controller_1.MenuController],
        providers: [menu_service_1.MenuService],
        exports: [menu_service_1.MenuService],
    })
], MenuModule);


/***/ }),
/* 59 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MenuController = void 0;
const common_1 = __webpack_require__(3);
const menu_service_1 = __webpack_require__(52);
const create_menu_dto_1 = __webpack_require__(60);
const permission_decorator_1 = __webpack_require__(26);
const update_menu_dto_1 = __webpack_require__(61);
const reject_decorator_1 = __webpack_require__(33);
let MenuController = exports.MenuController = class MenuController {
    constructor(menuService) {
        this.menuService = menuService;
    }
    async getMenus(email) {
        return this.menuService.findRoleMenu(email);
    }
    async getAllMenus() {
        return this.menuService.findAllMenu();
    }
    async createMenu(dto) {
        return this.menuService.createMenu(dto, false);
    }
    async updateMenu(dto) {
        return this.menuService.updateMenu(dto);
    }
    async deleteMenu(id, parentId) {
        return this.menuService.deleteMenu(id, parentId);
    }
};
__decorate([
    (0, common_1.Get)('/role/:email'),
    __param(0, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "getMenus", null);
__decorate([
    (0, common_1.Get)(),
    (0, permission_decorator_1.Permission)('menu::query'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "getAllMenus", null);
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, common_1.Post)(),
    (0, permission_decorator_1.Permission)('menu::add'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_menu_dto_1.CreateMenuDto !== "undefined" && create_menu_dto_1.CreateMenuDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "createMenu", null);
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, common_1.Patch)(),
    (0, permission_decorator_1.Permission)('menu::update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof update_menu_dto_1.UpdateMenuDto !== "undefined" && update_menu_dto_1.UpdateMenuDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "updateMenu", null);
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, common_1.Delete)(),
    (0, permission_decorator_1.Permission)('menu::remove'),
    __param(0, (0, common_1.Query)('id')),
    __param(1, (0, common_1.Query)('parentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "deleteMenu", null);
exports.MenuController = MenuController = __decorate([
    (0, common_1.Controller)('menu'),
    __metadata("design:paramtypes", [typeof (_a = typeof menu_service_1.MenuService !== "undefined" && menu_service_1.MenuService) === "function" ? _a : Object])
], MenuController);


/***/ }),
/* 60 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateMenuDto = void 0;
const class_validator_1 = __webpack_require__(25);
const nestjs_i18n_1 = __webpack_require__(20);
class CreateMenuDto {
}
exports.CreateMenuDto = CreateMenuDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", Number)
], CreateMenuDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], CreateMenuDto.prototype, "menuType", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], CreateMenuDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], CreateMenuDto.prototype, "path", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], CreateMenuDto.prototype, "component", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], CreateMenuDto.prototype, "icon", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], CreateMenuDto.prototype, "locale", void 0);


/***/ }),
/* 61 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateMenuDto = void 0;
const mapped_types_1 = __webpack_require__(28);
const create_menu_dto_1 = __webpack_require__(60);
const class_validator_1 = __webpack_require__(25);
const nestjs_i18n_1 = __webpack_require__(20);
class UpdateMenuDto extends (0, mapped_types_1.PartialType)(create_menu_dto_1.CreateMenuDto) {
}
exports.UpdateMenuDto = UpdateMenuDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", Number)
], UpdateMenuDto.prototype, "id", void 0);


/***/ }),
/* 62 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 63 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.menuData = void 0;
exports.menuData = [
    {
        name: 'Board',
        order: 1,
        parentId: null,
        menuType: 'normal',
        icon: 'IconApplication',
        component: 'board/index',
        path: 'board',
        locale: 'menu.board',
    },
    {
        name: 'Home',
        order: 1,
        parentId: null,
        menuType: 'normal',
        icon: '',
        component: 'board/home/index',
        path: 'home',
        locale: 'menu.home',
    },
    {
        name: 'Work',
        order: 2,
        parentId: null,
        menuType: 'normal',
        icon: '',
        component: 'board/work/index',
        path: 'work',
        locale: 'menu.work',
    },
    {
        name: 'List',
        order: 2,
        parentId: null,
        menuType: 'normal',
        icon: 'IconFiles',
        component: 'list/index',
        path: 'list',
        locale: 'menu.list',
    },
    {
        name: 'Table',
        order: 1,
        parentId: null,
        menuType: 'normal',
        icon: '',
        component: 'list/search-table/index',
        path: 'table',
        locale: 'menu.list.searchTable',
    },
    {
        name: 'Form',
        order: 3,
        parentId: null,
        menuType: 'normal',
        icon: 'IconSetting',
        component: 'form/index',
        path: 'form',
        locale: 'menu.form',
    },
    {
        name: 'Base',
        order: 1,
        parentId: null,
        menuType: 'normal',
        icon: '',
        component: 'form/base/index',
        path: 'base',
        locale: 'menu.form.base',
    },
    {
        name: 'Step',
        order: 2,
        parentId: null,
        menuType: 'normal',
        icon: '',
        component: 'form/step/index',
        path: 'step',
        locale: 'menu.form.step',
    },
    {
        name: 'Profile',
        order: 4,
        parentId: null,
        menuType: 'normal',
        icon: 'IconFiletext',
        component: 'profile/index',
        path: 'profile',
        locale: 'menu.profile',
    },
    {
        name: 'Detail',
        order: 1,
        parentId: null,
        menuType: 'normal',
        icon: '',
        component: 'profile/detail/index',
        path: 'detail',
        locale: 'menu.profile.detail',
    },
    {
        name: 'Result',
        order: 5,
        parentId: null,
        menuType: 'normal',
        icon: 'IconSuccessful',
        component: 'result/index',
        path: 'result',
        locale: 'menu.result',
    },
    {
        name: 'Success',
        order: 1,
        parentId: null,
        menuType: 'normal',
        icon: '',
        component: 'result/success/index',
        path: 'success',
        locale: 'menu.result.success',
    },
    {
        name: 'Error',
        order: 2,
        parentId: null,
        menuType: 'normal',
        icon: '',
        component: 'result/error/index',
        path: 'error',
        locale: 'menu.result.error',
    },
    {
        name: 'Exception',
        order: 6,
        parentId: null,
        menuType: 'normal',
        icon: 'IconCueL',
        component: 'exception/index',
        path: 'exception',
        locale: 'menu.exception',
    },
    {
        name: '403',
        order: 1,
        parentId: null,
        menuType: 'normal',
        icon: '',
        component: 'exception/403/index',
        path: '403',
        locale: 'menu.exception.403',
    },
    {
        name: '404',
        order: 2,
        parentId: null,
        menuType: 'normal',
        icon: '',
        component: 'exception/404/index',
        path: '404',
        locale: 'menu.exception.404',
    },
    {
        name: '500',
        order: 1,
        parentId: null,
        menuType: 'normal',
        icon: '',
        component: 'exception/500/index',
        path: '500',
        locale: 'menu.exception.500',
    },
    {
        name: 'User',
        order: 7,
        parentId: null,
        menuType: 'normal',
        icon: 'IconUser',
        component: 'user/index',
        path: 'user',
        locale: 'menu.user',
    },
    {
        name: 'Info',
        order: 1,
        parentId: null,
        menuType: 'normal',
        icon: '',
        component: 'user/info/index',
        path: 'info',
        locale: 'menu.user.info',
    },
    {
        name: 'Cloud',
        order: 8,
        parentId: null,
        menuType: 'normal',
        icon: 'IconDownloadCloud',
        component: 'cloud/index',
        path: 'cloud',
        locale: 'menu.cloud',
    },
    {
        name: 'Hello',
        order: 1,
        parentId: null,
        menuType: 'normal',
        icon: '',
        component: 'cloud/hello/index',
        path: 'hello',
        locale: 'menu.cloud.hello',
    },
    {
        name: 'Contracts',
        order: 2,
        parentId: null,
        menuType: 'normal',
        icon: '',
        component: 'cloud/contracts/index',
        path: 'contracts',
        locale: 'menu.cloud.contracts',
    },
    {
        name: 'MenuPage',
        order: 9,
        parentId: null,
        menuType: 'normal',
        icon: 'IconApp',
        component: 'menu/index',
        path: 'menuPage',
        locale: 'menu.menuPage',
    },
    {
        name: 'SecondMenu',
        order: 1,
        parentId: null,
        menuType: 'normal',
        icon: '',
        component: 'menu/index',
        path: 'secondMenu',
        locale: 'menu.menuPage.second',
    },
    {
        name: 'ThirdMenu',
        order: 1,
        parentId: null,
        menuType: 'normal',
        icon: '',
        component: 'menu/demo/index',
        path: 'thirdMenu',
        locale: 'menu.menuPage.third',
    },
    {
        name: 'SystemManager',
        order: 10,
        parentId: null,
        menuType: 'normal',
        icon: 'IconTotal',
        component: 'menu/index',
        path: '',
        locale: 'menu.systemManager',
    },
    {
        name: 'AllMenu',
        order: 1,
        parentId: null,
        menuType: 'admin',
        icon: 'IconGrade',
        component: 'menu/info/index',
        path: 'menu/allMenu',
        locale: 'menu.menu.info',
    },
    {
        name: 'AllPermission',
        order: 1,
        parentId: null,
        menuType: 'admin',
        icon: 'IconFolderOpened',
        component: 'permission/info/index',
        path: 'permission/allPermission',
        locale: 'menu.permission.info',
    },
    {
        name: 'AllRole',
        order: 1,
        parentId: null,
        menuType: 'admin',
        icon: 'IconActivation',
        component: 'role/info/index',
        path: 'role/allRole',
        locale: 'menu.role.info',
    },
    {
        name: 'AllInfo',
        order: 1,
        parentId: null,
        menuType: 'admin',
        icon: 'IconGroup',
        component: 'userManager/info/index',
        path: 'userManager/allInfo',
        locale: 'menu.userManager.info',
    },
    {
        name: 'Local',
        order: 14,
        parentId: null,
        menuType: '',
        icon: 'IconFlag',
        component: 'locale/index',
        path: 'locale',
        locale: 'menu.i18n',
    },
];


/***/ }),
/* 64 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.I18Module = void 0;
const common_1 = __webpack_require__(3);
const i18_service_1 = __webpack_require__(65);
const i18_controller_1 = __webpack_require__(66);
const typeorm_1 = __webpack_require__(6);
const models_1 = __webpack_require__(7);
const lang_service_1 = __webpack_require__(69);
const lang_controller_1 = __webpack_require__(70);
let I18Module = exports.I18Module = class I18Module {
};
exports.I18Module = I18Module = __decorate([
    (0, common_1.Module)({
        controllers: [i18_controller_1.I18Controller, lang_controller_1.I18nLangController],
        providers: [i18_service_1.I18Service, lang_service_1.I18LangService],
        imports: [typeorm_1.TypeOrmModule.forFeature([models_1.Lang, models_1.I18])],
        exports: [i18_service_1.I18Service, lang_service_1.I18LangService],
    })
], I18Module);


/***/ }),
/* 65 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.I18Service = void 0;
const common_1 = __webpack_require__(3);
const typeorm_1 = __webpack_require__(6);
const models_1 = __webpack_require__(7);
const typeorm_2 = __webpack_require__(9);
const nestjs_typeorm_paginate_1 = __webpack_require__(21);
const nestjs_i18n_1 = __webpack_require__(20);
let I18Service = exports.I18Service = class I18Service {
    constructor(i18, lang, i18n) {
        this.i18 = i18;
        this.lang = lang;
        this.i18n = i18n;
        this.COUNT_CACHE = 'i18::count::cache';
    }
    async getFormat(lang) {
        const data = await this.lang.find({
            where: {
                name: lang === '' ? undefined : lang,
            },
            relations: ['i18'],
        });
        const ret = {};
        for (let i = 0; i < data.length; i++) {
            const { name, i18 } = data[i];
            ret[name] = {};
            for (let i = 0; i < i18.length; i++) {
                const i18Item = i18[i];
                ret[name][i18Item.key] = i18Item.content;
            }
        }
        return ret;
    }
    async create(createI18Dto) {
        const { key, content, lang } = createI18Dto;
        const i18 = this.i18.create();
        const langRecord = await this.lang.findOne({
            where: {
                id: lang,
            },
        });
        if (!langRecord) {
            throw new common_1.HttpException(this.i18n.t('exception.lang.notExists', {
                args: { lang },
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.NOT_FOUND);
        }
        const i18Item = await this.i18.findOne({
            where: {
                key,
                lang: langRecord,
            },
        });
        if (i18Item) {
            throw new common_1.HttpException(this.i18n.t('exception.i18.exists', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.BAD_REQUEST);
        }
        i18.content = content;
        i18.key = key;
        i18.lang = langRecord;
        const items = await this.i18.save(i18);
        return items;
    }
    async has(key, langId) {
        return this.i18.findOne({
            where: {
                key,
                lang: {
                    id: langId,
                },
            },
        });
    }
    async findAll(page, limit, all, lang, content, key) {
        let count = 0;
        if (all) {
            count = await this.i18.count();
        }
        const where = {
            lang: lang && lang.length ? { id: (0, typeorm_2.In)(lang) } : undefined,
            content: content ? (0, typeorm_2.Like)(content) : undefined,
            key: key ? (0, typeorm_2.Like)(key) : undefined,
        };
        if (page && limit) {
            return (0, nestjs_typeorm_paginate_1.paginate)(this.i18, {
                limit,
                page,
            }, {
                relations: ['lang'],
                loadEagerRelations: true,
                where,
            });
        }
        else {
            return (0, nestjs_typeorm_paginate_1.paginate)(this.i18, {
                limit: all ? count || process.env.PAGITION_LIMIT : limit,
                page: Number.isNaN(page) ? process.env.PAGITION_PAGE : page,
            }, {
                relations: ['lang'],
                loadEagerRelations: true,
                where,
            });
        }
    }
    async findOne(id) {
        const [item] = await this.i18.find({
            where: {
                id,
            },
            loadEagerRelations: true,
            relations: ['lang'],
        });
        if (!item) {
            throw new common_1.HttpException(this.i18n.t('exception.i18.notExists', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.NOT_FOUND);
        }
        return item;
    }
    async update(id, updateI18Dto) {
        const item = await this.findOne(id);
        item.content = updateI18Dto.content;
        item.key = updateI18Dto.key;
        const lang = await this.lang.findOne({
            where: {
                id: updateI18Dto.lang,
            },
        });
        if (!lang) {
            throw new common_1.HttpException(this.i18n.t('exception.lang.notExists', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.NOT_FOUND);
        }
        item.lang = lang;
        return await this.i18.save(item);
    }
    async remove(id) {
        const item = await this.findOne(id);
        await this.i18.remove(item);
        return item;
    }
};
exports.I18Service = I18Service = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(models_1.I18)),
    __param(1, (0, typeorm_1.InjectRepository)(models_1.Lang)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof nestjs_i18n_1.I18nService !== "undefined" && nestjs_i18n_1.I18nService) === "function" ? _c : Object])
], I18Service);


/***/ }),
/* 66 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.I18Controller = void 0;
const common_1 = __webpack_require__(3);
const i18_service_1 = __webpack_require__(65);
const create_i18_dto_1 = __webpack_require__(67);
const update_i18_dto_1 = __webpack_require__(68);
const permission_decorator_1 = __webpack_require__(26);
const reject_decorator_1 = __webpack_require__(33);
let I18Controller = exports.I18Controller = class I18Controller {
    constructor(i18Service) {
        this.i18Service = i18Service;
    }
    create(createI18Dto) {
        return this.i18Service.create(createI18Dto);
    }
    getFormat(lang) {
        return this.i18Service.getFormat(lang);
    }
    findAll(page, limit, all, lang, key, content) {
        return this.i18Service.findAll(page, limit, Boolean(all), lang, content, key);
    }
    findOne(id) {
        return this.i18Service.findOne(id);
    }
    update(id, updateI18Dto) {
        return this.i18Service.update(id, updateI18Dto);
    }
    remove(id) {
        return this.i18Service.remove(id);
    }
};
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, permission_decorator_1.Permission)('i18n::add'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_i18_dto_1.CreateI18Dto !== "undefined" && create_i18_dto_1.CreateI18Dto) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], I18Controller.prototype, "create", null);
__decorate([
    (0, common_1.Get)('format'),
    __param(0, (0, common_1.Query)('lang')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], I18Controller.prototype, "getFormat", null);
__decorate([
    (0, permission_decorator_1.Permission)('i18n::query'),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(0), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('all', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('lang', new common_1.DefaultValuePipe([]), common_1.ParseArrayPipe)),
    __param(4, (0, common_1.Query)('key')),
    __param(5, (0, common_1.Query)('content')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Array, String, String]),
    __metadata("design:returntype", void 0)
], I18Controller.prototype, "findAll", null);
__decorate([
    (0, permission_decorator_1.Permission)('i18n::query'),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], I18Controller.prototype, "findOne", null);
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, permission_decorator_1.Permission)('i18n::update'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, typeof (_c = typeof update_i18_dto_1.UpdateI18Dto !== "undefined" && update_i18_dto_1.UpdateI18Dto) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], I18Controller.prototype, "update", null);
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, permission_decorator_1.Permission)('i18n::remove'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], I18Controller.prototype, "remove", null);
exports.I18Controller = I18Controller = __decorate([
    (0, common_1.Controller)('i18'),
    __metadata("design:paramtypes", [typeof (_a = typeof i18_service_1.I18Service !== "undefined" && i18_service_1.I18Service) === "function" ? _a : Object])
], I18Controller);


/***/ }),
/* 67 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateI18Dto = void 0;
const class_validator_1 = __webpack_require__(25);
const nestjs_i18n_1 = __webpack_require__(20);
class CreateI18Dto {
}
exports.CreateI18Dto = CreateI18Dto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", Number)
], CreateI18Dto.prototype, "lang", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], CreateI18Dto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], CreateI18Dto.prototype, "content", void 0);


/***/ }),
/* 68 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateI18Dto = void 0;
const mapped_types_1 = __webpack_require__(28);
const create_i18_dto_1 = __webpack_require__(67);
class UpdateI18Dto extends (0, mapped_types_1.PartialType)(create_i18_dto_1.CreateI18Dto) {
}
exports.UpdateI18Dto = UpdateI18Dto;


/***/ }),
/* 69 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.I18LangService = void 0;
const models_1 = __webpack_require__(7);
const common_1 = __webpack_require__(3);
const typeorm_1 = __webpack_require__(6);
const typeorm_2 = __webpack_require__(9);
const nestjs_i18n_1 = __webpack_require__(20);
let I18LangService = exports.I18LangService = class I18LangService {
    constructor(i18, lang, i18n) {
        this.i18 = i18;
        this.lang = lang;
        this.i18n = i18n;
    }
    findAll() {
        return this.lang.find();
    }
    async create({ name }) {
        const item = await this.lang.findOneBy({ name });
        if (item) {
            throw new common_1.HttpException(this.i18n.t('exception.lang.exists', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
                args: {
                    name,
                },
            }), common_1.HttpStatus.CONFLICT);
        }
        const lang = this.lang.create();
        lang.name = name;
        return this.lang.save(lang);
    }
    findOne(id) {
        return this.lang.findOneBy({ id });
    }
    async update(id, data) {
        const item = await this.findOne(id);
        if (!item) {
            throw new common_1.HttpException(this.i18n.t('exception.lang.notExistsCommon', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.NOT_FOUND);
        }
        item.name = data.name;
        return await this.lang.save(item);
    }
    async remove(id) {
        const item = await this.findOne(id);
        if (!item) {
            throw new common_1.HttpException(this.i18n.t('exception.lang.notExistsCommon', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
            }), common_1.HttpStatus.NOT_FOUND);
        }
        const i18Record = await this.i18.findOneBy({ lang: item });
        if (i18Record) {
            throw new common_1.HttpException(this.i18n.t('exception.lang.DELETE_LANG_CONFLICT', {
                lang: nestjs_i18n_1.I18nContext.current().lang,
                args: {
                    name: item.name,
                },
            }), common_1.HttpStatus.CONFLICT);
        }
        return await this.lang.remove(item);
    }
};
exports.I18LangService = I18LangService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(models_1.I18)),
    __param(1, (0, typeorm_1.InjectRepository)(models_1.Lang)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object, typeof (_b = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _b : Object, typeof (_c = typeof nestjs_i18n_1.I18nService !== "undefined" && nestjs_i18n_1.I18nService) === "function" ? _c : Object])
], I18LangService);


/***/ }),
/* 70 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.I18nLangController = void 0;
const common_1 = __webpack_require__(3);
const lang_service_1 = __webpack_require__(69);
const create_lang_dto_1 = __webpack_require__(71);
const permission_decorator_1 = __webpack_require__(26);
const reject_decorator_1 = __webpack_require__(33);
let I18nLangController = exports.I18nLangController = class I18nLangController {
    constructor(langService) {
        this.langService = langService;
    }
    createLang(data) {
        return this.langService.create(data);
    }
    findAllLang() {
        return this.langService.findAll();
    }
    updateLang(id, data) {
        return this.langService.update(id, data);
    }
    removeLang(id) {
        return this.langService.remove(id);
    }
};
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, permission_decorator_1.Permission)('lang::add'),
    (0, common_1.Post)(''),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof create_lang_dto_1.CreateLang !== "undefined" && create_lang_dto_1.CreateLang) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], I18nLangController.prototype, "createLang", null);
__decorate([
    (0, permission_decorator_1.Permission)('lang::query'),
    (0, common_1.Get)(''),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], I18nLangController.prototype, "findAllLang", null);
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, permission_decorator_1.Permission)('lang::update'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, typeof (_c = typeof Partial !== "undefined" && Partial) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], I18nLangController.prototype, "updateLang", null);
__decorate([
    (0, reject_decorator_1.Reject)(),
    (0, permission_decorator_1.Permission)('lang::remove'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], I18nLangController.prototype, "removeLang", null);
exports.I18nLangController = I18nLangController = __decorate([
    (0, common_1.Controller)('/lang'),
    __metadata("design:paramtypes", [typeof (_a = typeof lang_service_1.I18LangService !== "undefined" && lang_service_1.I18LangService) === "function" ? _a : Object])
], I18nLangController);


/***/ }),
/* 71 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateLang = void 0;
const class_validator_1 = __webpack_require__(25);
const nestjs_i18n_1 = __webpack_require__(20);
class CreateLang {
}
exports.CreateLang = CreateLang;
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.NOT_EMPTY'),
    }),
    __metadata("design:type", String)
], CreateLang.prototype, "name", void 0);


/***/ }),
/* 72 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MockModule = void 0;
const common_1 = __webpack_require__(3);
const mock_service_1 = __webpack_require__(73);
const mock_controller_1 = __webpack_require__(74);
let MockModule = exports.MockModule = class MockModule {
};
exports.MockModule = MockModule = __decorate([
    (0, common_1.Module)({
        controllers: [mock_controller_1.MockController],
        providers: [mock_service_1.MockService],
    })
], MockModule);


/***/ }),
/* 73 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MockService = void 0;
const common_1 = __webpack_require__(3);
let MockService = exports.MockService = class MockService {
};
exports.MockService = MockService = __decorate([
    (0, common_1.Injectable)()
], MockService);


/***/ }),
/* 74 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MockController = void 0;
const common_1 = __webpack_require__(3);
const mock_service_1 = __webpack_require__(73);
const express_1 = __webpack_require__(75);
const data_1 = __webpack_require__(76);
let MockController = exports.MockController = class MockController {
    constructor(mockService) {
        this.mockService = mockService;
    }
    async getMock(req) {
        const path = req.path.replace('/mock', '');
        const item = data_1.default.filter((dataItem) => dataItem.method === 'get' && dataItem.url === path);
        if (!item.length) {
            throw new common_1.HttpException('not found', common_1.HttpStatus.NOT_FOUND);
        }
        return item[0].response({ body: null });
    }
    async postMock(req) {
        const path = req.path.replace('/mock', '');
        const item = data_1.default.filter((dataItem) => dataItem.method === 'post' && dataItem.url === path);
        if (!item.length) {
            throw new common_1.HttpException('not found', common_1.HttpStatus.NOT_FOUND);
        }
        return item[0].response({ body: req.body });
    }
};
__decorate([
    (0, common_1.Get)('*'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof express_1.Request !== "undefined" && express_1.Request) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], MockController.prototype, "getMock", null);
__decorate([
    (0, common_1.Post)('*'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof express_1.Request !== "undefined" && express_1.Request) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], MockController.prototype, "postMock", null);
exports.MockController = MockController = __decorate([
    (0, common_1.Controller)('mock'),
    __metadata("design:paramtypes", [typeof (_a = typeof mock_service_1.MockService !== "undefined" && mock_service_1.MockService) === "function" ? _a : Object])
], MockController);


/***/ }),
/* 75 */
/***/ ((module) => {

module.exports = require("express");

/***/ }),
/* 76 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const board_1 = __webpack_require__(77);
const forms_1 = __webpack_require__(80);
const list_1 = __webpack_require__(81);
const profile_1 = __webpack_require__(82);
const user_1 = __webpack_require__(83);
exports["default"] = [...board_1.default, ...list_1.default, ...profile_1.default, ...user_1.default, ...forms_1.default];


/***/ }),
/* 77 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const mockjs_1 = __webpack_require__(78);
const utils_1 = __webpack_require__(79);
const initData = (0, mockjs_1.mock)({
    options: [
        {
            value: '1',
            label: 'work.mock.employees',
        },
        {
            value: '2',
            label: 'work.mock.onboard',
        },
        {
            value: '3',
            label: 'work.mock.Test',
        },
    ],
});
const initData1 = (0, mockjs_1.mock)({
    options: [
        {
            value: '1',
            label: 'work.mock.week1',
        },
        {
            value: '2',
            label: 'work.mock.week2',
        },
        {
            value: '3',
            label: 'work.mock.week3',
        },
    ],
});
const initData2 = (0, mockjs_1.mock)({
    options: [
        {
            value: '1',
            label: 'work.mock.network',
        },
        {
            value: '2',
            label: 'work.mock.centralized',
        },
        {
            value: '3',
            label: 'work.mock.hardware',
        },
    ],
});
const changeDate = (0, mockjs_1.mock)({
    options1: [101, 212, 122, 232],
    options2: [323, 555, 425, 2221],
    options3: [23234, 234, 989, 122],
});
exports["default"] = [
    {
        url: '/api/user/getdata',
        method: 'get',
        response: () => {
            return (0, utils_1.successResponseWrap)(initData);
        },
    },
    {
        url: '/api/user/getrpractic',
        method: 'get',
        response: () => {
            return (0, utils_1.successResponseWrap)(initData1);
        },
    },
    {
        url: '/api/user/getrtrain',
        method: 'get',
        response: () => {
            return (0, utils_1.successResponseWrap)(initData2);
        },
    },
    {
        url: '/api/user/getselect',
        method: 'post',
        response: (data) => {
            let result = null;
            if (data.body === 1) {
                result = (0, utils_1.successResponseWrap)(changeDate.options1);
            }
            else if (data.body === 2) {
                result = (0, utils_1.successResponseWrap)(changeDate.options2);
            }
            else {
                result = (0, utils_1.successResponseWrap)(changeDate.options3);
            }
            return result;
        },
    },
];


/***/ }),
/* 78 */
/***/ ((module) => {

module.exports = require("mockjs");

/***/ }),
/* 79 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.failResponseWrap = exports.successResponseWrap = exports.failResponseWrapper = exports.successResponseWrapper = void 0;
const successResponseWrapper = (data) => {
    return {
        data,
        status: 'ok',
        msg: '请求成功',
        code: 20000,
    };
};
exports.successResponseWrapper = successResponseWrapper;
const failResponseWrapper = (data, msg, code = 50000) => {
    return {
        data,
        status: 'fail',
        msg,
        code,
    };
};
exports.failResponseWrapper = failResponseWrapper;
const successResponseWrap = (data) => {
    return {
        data,
        errMsg: '',
        code: '0',
    };
};
exports.successResponseWrap = successResponseWrap;
const failResponseWrap = (data, errMsg, code = '500') => {
    return {
        data,
        errMsg,
        code,
    };
};
exports.failResponseWrap = failResponseWrap;


/***/ }),
/* 80 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const mockjs_1 = __webpack_require__(78);
const utils_1 = __webpack_require__(79);
const initBase = (0, mockjs_1.mock)({
    Project: [
        'baseForm.form.label.projectone',
        'baseForm.form.label.projecttwo',
        'baseForm.form.label.projectthree',
    ],
    rank: [
        {
            value: '1',
            label: '01',
        },
        {
            value: '2',
            label: '02',
        },
        {
            value: '3',
            label: '03',
        },
        {
            value: '4',
            label: '04',
        },
        {
            value: '5',
            label: '05',
        },
    ],
    person: [
        {
            value: 'local',
            label: 'baseForm.form.label.personone',
        },
        {
            value: 'noemployees',
            label: 'baseForm.form.label.persontwo',
        },
        {
            value: 'chineseemployees',
            label: 'baseForm.form.label.personthree',
        },
    ],
    frequency: [
        'baseForm.form.label.frequencyone',
        'baseForm.form.label.frequencytwo',
        'baseForm.form.label.frequencythree',
        'baseForm.form.label.frequencyfour',
    ],
});
const initStep = (0, mockjs_1.mock)({
    position: [
        {
            value: '1',
            label: 'position1',
        },
        {
            value: '2',
            label: 'position2',
        },
        {
            value: '3',
            label: 'position3',
        },
        {
            value: '4',
            label: 'position4',
        },
    ],
    HR: [
        {
            value: '1',
            label: 'test01',
        },
        {
            value: '2',
            label: 'test01',
        },
        {
            value: '3',
            label: 'test03',
        },
    ],
    mentor: ['Teacher1', 'Teacher2', 'Teacher3', 'Teacher4'],
    director: ['Director1', 'Director2', 'Director3', 'Director4'],
});
exports["default"] = [
    {
        url: '/api/base/getdata',
        method: 'get',
        response: () => {
            return (0, utils_1.successResponseWrap)(initBase);
        },
    },
    {
        url: '/api/step/getdata',
        method: 'get',
        response: () => {
            return (0, utils_1.successResponseWrap)(initStep);
        },
    },
    {
        url: '/api/channel-form/submit',
        method: 'post',
        response: () => {
            return (0, utils_1.successResponseWrap)('ok');
        },
    },
];


/***/ }),
/* 81 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const mockjs_1 = __webpack_require__(78);
const utils_1 = __webpack_require__(79);
const taskList = (0, mockjs_1.mock)({
    'list|60': [
        {
            id: '@id',
            name: 'xiaoming',
            rank: '初级',
            description: '一段描述文字',
            createTime: '@datetime',
            'status|1': ['0', '1', '2'],
            type: 'Tiny Design',
            roles: '前端',
            employeeNo: '00022456',
            department: '公共服务',
            departmentLevel: '中级',
            workbenchName: 'work',
            project: 'TinyDesign',
            address: '西安研究所',
            lastUpdateUser: '张三',
        },
    ],
});
let treeData = [];
exports["default"] = [
    {
        url: '/api/employee/getEmployee',
        method: 'post',
        response: (params) => {
            const { pageIndex = 1, pageSize = 10 } = JSON.parse(JSON.stringify(params.body));
            const index = pageIndex;
            const size = pageSize;
            const offset = (index - 1) * size;
            const count = index * size;
            treeData = taskList.list.slice(offset, count);
            const data = (0, mockjs_1.mock)({
                total: 60,
                data: treeData,
            });
            return (0, utils_1.successResponseWrap)(data);
        },
    },
];


/***/ }),
/* 82 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const utils_1 = __webpack_require__(79);
const mockjs_1 = __webpack_require__(78);
const initData = (0, mockjs_1.mock)({
    Project: [
        'baseForm.form.label.projectone',
        'baseForm.form.label.projecttwo',
        'baseForm.form.label.projectthree',
    ],
    tableData: [
        {
            id: '1',
            version: 'version1',
            operation: 'offline',
            updated: 'person1',
            time: '2022-10-11',
        },
        {
            id: '2',
            version: 'version2',
            operation: 'offline',
            updated: 'person2',
            time: '2022-10-12',
        },
        {
            id: '3',
            version: 'version3',
            operation: 'online',
            updated: 'person3',
            time: '2022-10-13',
        },
        {
            id: '4',
            version: 'version4',
            operation: 'online',
            updated: 'person4',
            time: '2022-10-14',
        },
        {
            id: '5',
            version: 'version5',
            operation: 'online',
            updated: 'person5',
            time: '2022-10-15',
        },
        {
            id: '6',
            version: 'version6',
            operation: 'online',
            updated: 'person6',
            time: '2022-10-16',
        },
    ],
});
exports["default"] = [
    {
        url: '/api/detail/getdata',
        method: 'get',
        response: () => {
            return (0, utils_1.successResponseWrap)(initData);
        },
    },
];


/***/ }),
/* 83 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const utils_1 = __webpack_require__(79);
const setup_1 = __webpack_require__(84);
const positive = JSON.parse(JSON.stringify(setup_1.initData.tableData));
const negative = JSON.parse(JSON.stringify(setup_1.initData.tableData.reverse()));
const initlist = JSON.parse(JSON.stringify(setup_1.initData.chartData[0].list));
const userInfo = JSON.parse(JSON.stringify(setup_1.initData.userInfo));
exports["default"] = [
    {
        url: '/api/user/data',
        method: 'post',
        response: (params) => {
            const { sort, startTime, endTime, filterStatus, filterType } = JSON.parse(JSON.stringify(params.body));
            setup_1.initData.tableData = positive;
            setup_1.initData.chartData[0].list = initlist;
            if (sort === 1 || sort === 3) {
                setup_1.initData.chartData[0].list.reverse();
                setup_1.initData.tableData = positive;
                return (0, utils_1.successResponseWrap)(setup_1.initData);
            }
            if (sort === 2 || sort === 4) {
                setup_1.initData.chartData[0].list.reverse();
                setup_1.initData.tableData = negative;
                return (0, utils_1.successResponseWrap)(setup_1.initData);
            }
            if (startTime !== '' ||
                endTime !== '' ||
                filterStatus.length !== 0 ||
                (filterType.length !== 0 && sort === undefined)) {
                const start = new Date(JSON.parse(JSON.stringify(startTime))).getTime();
                const end = new Date(JSON.parse(JSON.stringify(endTime))).getTime();
                const table = setup_1.initData.tableData.filter(function (item) {
                    return (filterType.includes(item.bid) &&
                        filterStatus.includes(item.pid) &&
                        new Date(JSON.parse(JSON.stringify(item.time))).getTime() - start >
                            0 &&
                        new Date(JSON.parse(JSON.stringify(item.time))).getTime() - end < 0);
                });
                const chart = setup_1.initData.chartData[0].list.filter(function (item) {
                    return (filterType.includes(item.bid) && filterStatus.includes(item.pid));
                });
                setup_1.initData.tableData = table;
                setup_1.initData.chartData[0].list = chart;
                return (0, utils_1.successResponseWrap)(setup_1.initData);
            }
            return (0, utils_1.successResponseWrap)(setup_1.initData);
        },
    },
];


/***/ }),
/* 84 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.initData = void 0;
const mockjs_1 = __webpack_require__(78);
exports.initData = (0, mockjs_1.mock)({
    chartData: [
        {
            title: 'userInfo.week.1',
            value: 1,
            list: [
                {
                    type: 'userInfo.type.optionA',
                    status: 'userInfo.status.optionA',
                    len: 1,
                    bid: 'A',
                    pid: 'A',
                },
                {
                    type: 'userInfo.type.optionC',
                    status: 'userInfo.status.optionB',
                    len: 5,
                    bid: 'c',
                    pid: 'B',
                },
                {
                    type: 'userInfo.type.optionA',
                    status: 'userInfo.status.optionC',
                    len: 3,
                    bid: 'A',
                    pid: 'C',
                },
                {
                    type: 'userInfo.type.optionA',
                    status: 'userInfo.status.optionA',
                    len: 1,
                    bid: 'A',
                    pid: 'A',
                },
                {
                    type: 'userInfo.type.optionB',
                    status: 'userInfo.status.optionA',
                    len: 6,
                    bid: 'B',
                    pid: 'A',
                },
                {
                    type: 'userInfo.type.optionA',
                    status: 'userInfo.status.optionC',
                    len: 1,
                    bid: 'A',
                    pid: 'C',
                },
                {
                    type: 'userInfo.type.optionA',
                    status: 'userInfo.status.optionA',
                    len: 1,
                    bid: 'A',
                    pid: 'A',
                },
                {
                    type: 'userInfo.type.optionA',
                    status: 'userInfo.status.optionB',
                    len: 1,
                    bid: 'A',
                    pid: 'B',
                },
                {
                    type: 'userInfo.type.optionB',
                    status: 'userInfo.status.optionA',
                    len: 1,
                    bid: 'B',
                    pid: 'A',
                },
                {
                    type: 'userInfo.type.optionA',
                    status: 'userInfo.status.optionC',
                    len: 1,
                    bid: 'A',
                    pid: 'C',
                },
                {
                    type: 'userInfo.type.optionA',
                    status: 'userInfo.status.optionD',
                    len: 1,
                    bid: 'A',
                    pid: 'D',
                },
                {
                    type: 'userInfo.type.optionC',
                    status: 'userInfo.status.optionD',
                    len: 1,
                    bid: 'C',
                    pid: 'D',
                },
                {
                    type: 'userInfo.type.optionA',
                    status: 'userInfo.status.optionD',
                    len: 1,
                    bid: 'A',
                    pid: 'D',
                },
            ],
        },
        { title: 'userInfo.month.1', value: 0 },
        { title: 'userInfo.month.2', value: 0 },
        { title: 'userInfo.month.3', value: 0 },
        { title: 'userInfo.month.4', value: 0 },
        { title: 'userInfo.month.5', value: 0 },
        { title: 'userInfo.month.6', value: 0 },
        { title: 'userInfo.month.7', value: 0 },
        { title: 'userInfo.month.8', value: 0 },
        { title: 'userInfo.month.9', value: 0 },
        { title: 'userInfo.month.10', value: 0 },
        { title: 'userInfo.month.11', value: 0 },
        { title: 'userInfo.month.12', value: 0 },
        { title: 'userInfo.month.13', value: 0 },
        { title: 'userInfo.month.14', value: 0 },
        { title: 'userInfo.month.15', value: 0 },
        { title: 'userInfo.month.16', value: 0 },
        { title: 'userInfo.month.17', value: 0 },
    ],
    tableData: [
        {
            id: '1',
            bid: 'A',
            pid: 'D',
            name: 'GFD Company',
            time: '2021-12-18',
            type: 'userInfo.type.optionA',
            status: 'userInfo.status.optionD',
        },
        {
            id: '2',
            bid: 'B',
            pid: 'A',
            name: 'WWWW Company',
            time: '2021-11-18',
            type: 'userInfo.type.optionB',
            status: 'userInfo.status.optionA',
        },
        {
            id: '3',
            bid: 'C',
            pid: 'B',
            name: 'TGBYX Company',
            time: '2021-10-18',
            type: 'userInfo.type.optionC',
            status: 'userInfo.status.optionB',
        },
        {
            id: '4',
            bid: 'B',
            pid: 'D',
            name: 'GF Company',
            time: '2021-09-18',
            type: 'userInfo.type.optionB',
            status: 'userInfo.status.optionC',
        },
        {
            id: '5',
            bid: 'C',
            pid: 'C',
            name: 'Property management company',
            time: '2021-07-18',
            type: 'userInfo.type.optionA',
            status: 'userInfo.status.optionD',
        },
        {
            id: '6',
            bid: 'A',
            pid: 'C',
            name: 'Property management company',
            time: '2020-12-23',
            type: 'userInfo.type.optionA',
            status: 'userInfo.status.optionC',
        },
        {
            id: '7',
            bid: 'B',
            pid: 'C',
            name: 'GF Company',
            time: '2020-11-08',
            type: 'userInfo.type.optionB',
            status: 'userInfo.status.optionC',
        },
        {
            id: '8',
            bid: 'B',
            pid: 'C',
            name: 'WWWW Company',
            time: '2020-10-18',
            type: 'userInfo.type.optionB',
            status: 'userInfo.status.optionC',
        },
        {
            id: '9',
            bid: 'C',
            pid: 'D',
            name: 'WWWW Company',
            time: '2020-10-11',
            type: 'userInfo.type.optionC',
            status: 'userInfo.status.optionD',
        },
        {
            id: '10',
            bid: 'C',
            pid: 'D',
            name: 'TGBYX Company',
            time: '2020-06-18',
            type: 'userInfo.type.optionC',
            status: 'userInfo.status.optionD',
        },
    ],
    userInfo: {
        userId: '10000',
        username: 'admin',
        department: 'Tiny-Vue-Pro',
        employeeType: 'social recruitment',
        role: 'admin',
        job: 'Front end',
        probationStart: '2021-04-19',
        probationEnd: '2021-10-15',
        probationDuration: '180',
        protocolStart: '2021-04-19',
        protocolEnd: '2024-04-19',
        address: 'xian',
        status: 'normal',
    },
});


/***/ }),
/* 85 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RejectRequestGuard = void 0;
const common_1 = __webpack_require__(3);
const core_1 = __webpack_require__(1);
const nestjs_i18n_1 = __webpack_require__(20);
let RejectRequestGuard = exports.RejectRequestGuard = class RejectRequestGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    async canActivate(ctx) {
        const i18n = nestjs_i18n_1.I18nContext.current();
        const rejectRequest = this.reflector.getAllAndOverride('reject', [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (!rejectRequest) {
            return true;
        }
        throw new common_1.HttpException(i18n.t('exception.preview.reject-this-request', {
            lang: nestjs_i18n_1.I18nContext.current().lang,
        }), common_1.HttpStatus.BAD_REQUEST);
    }
};
exports.RejectRequestGuard = RejectRequestGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _a : Object])
], RejectRequestGuard);


/***/ }),
/* 86 */
/***/ ((module) => {

module.exports = require("dotenv");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(1);
const app_module_1 = __webpack_require__(2);
const dotenv = __webpack_require__(86);
const nestjs_i18n_1 = __webpack_require__(20);
dotenv.config({ path: '.env' });
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new nestjs_i18n_1.I18nValidationPipe());
    app.useGlobalFilters(new nestjs_i18n_1.I18nValidationExceptionFilter({
        errorFormatter: (errors) => {
            const reason = [];
            for (const err of errors) {
                reason.push(...Object.values(err.constraints));
            }
            return reason;
        },
    }));
    await app.listen(3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

})();

/******/ })()
;