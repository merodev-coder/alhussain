import mongoose, { Schema } from 'mongoose';
const HeroSlideSchema = new Schema({
    headline: { type: String, default: '', trim: true },
    subtitle: { type: String, default: '', trim: true },
    buttonText: { type: String, default: 'تصفح الآن', trim: true },
    buttonColor: { type: String, default: '#2563eb', trim: true },
    buttonLink: { type: String, default: '/laptops', trim: true },
    badgeImage: { type: String, default: null },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    dbIndex: { type: Number, required: true, default: 0 },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform(_doc, ret) {
            if (ret._id) {
                ret.id = ret._id.toString();
            }
            delete ret._id;
            delete ret.__v;
        },
    },
    toObject: {
        virtuals: true,
        versionKey: false,
        transform(_doc, ret) {
            if (ret._id) {
                ret.id = ret._id.toString();
            }
            delete ret._id;
            delete ret.__v;
        },
    },
});
HeroSlideSchema.index({ order: 1 });
HeroSlideSchema.index({ isActive: 1 });
HeroSlideSchema.index({ dbIndex: 1 });
export function getHeroSlideModel(connection) {
    if (connection.models.HeroSlide) {
        return connection.models.HeroSlide;
    }
    return connection.model('HeroSlide', HeroSlideSchema);
}
export default getHeroSlideModel(mongoose.connection);
