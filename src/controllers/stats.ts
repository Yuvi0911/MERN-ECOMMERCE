//isme humne jo admin dashboard me different charts liye h unka data manipulate kr rhe h database me. hum isme un sbhi types k charts me kya data jaiye ga vo calculate kr rhe h.

import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/products.js";
import { User } from "../models/user.js";
import { calculatePercentage, getChartData, getInventories } from "../utils/features.js";

export const getDashboardStats = TryCatch(async(req, res, next) => {

    let stats = {};

    if(myCache.has("admiin-stats")){
        stats = JSON.parse(myCache.get("admin-stats") as string)
    }
    else{
        const today = new Date();
    
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // //jo bhi month chal rha h uski 1st tarik aa jaiye gi isme
        // const startOfThisMonth = new Date(today.getFullYear(),today.getMonth(),1);

        // //aaj ki date tak kitna change huya h products me
        // const endOfThisMonth = today;

        // //pichle month ki starting date aa jaiye gi
        // const startOfLastMonth = new Date(today.getFullYear(),today.getMonth()-1,1);

        // //last month ki last tarik de dega
        // const endOfLastMonth = new Date(today.getFullYear(),today.getMonth(),0)


        // hum directly object bna skte h upar vali lines ka
        const thisMonth = {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: today
        }

        const lastMonth = {
            start:new Date(today.getFullYear(),today.getMonth()-1,1),
            end: new Date(today.getFullYear(),today.getMonth(),0)
        }

        
        //hum in sbhi ko promise bnaye ge rather than await use krne k, kyoki hum chahte h ki sbhi parallely chale na ki phle 1 complete resolve ho fir dusra, hum promise all use krege jisse sbhi ek sath resolve hoge

       //in dono ki help se hum product ki stats ka data nikalege

        //is mahine me kitne product bnaye h
        const thisMonthProductsPromise = Product.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end
            }
        })

        //last month me kitne products bnaye the
        const lastMonthProductsPromise = Product.find({
            createdAt:{
                $gte:lastMonth.start,
                $lte: lastMonth.end,
            }
        })
    
    
        //is mahine me kitne Users aaye h humari website pr
        const thisMonthUsersPromise = User.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end
            }
        })

        //last month me kitne users aaye the humari website pr
        const lastMonthUsersPromise = User.find({
            createdAt:{
                $gte:lastMonth.start,
                $lte: lastMonth.end,
            }
        })
    
    
        //is mahine me kitne orders hue h humari website pr
        const thisMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end
            }
        })

        //last month me kitne orders hue the humari website pr
        const lastMonthOrdersPromise = Order.find({
            createdAt:{
                $gte:lastMonth.start,
                $lte: lastMonth.end,
            }
        })

        const lastSixMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today,
            }
        })

        const latestTransactionsPromise = Order.find({}).select(["orderItems","discount","total","status"]).limit(4);

        const [ thisMonthProducts,
            thisMonthUsers,
            thisMonthOrders,
            lastMonthProducts,
            lastMonthUsers,
            lastMonthOrders,
            productsCount,
            usersCount,
            allOrders,
            lastSixMonthOrders,
            categories,
            femaleUsersCount,
            latestTransaction,
        ] = await Promise.all([
            thisMonthProductsPromise,
            thisMonthUsersPromise,
            thisMonthOrdersPromise,
            lastMonthProductsPromise,
            lastMonthUsersPromise,
            lastMonthOrdersPromise,
            Product.countDocuments(),
            User.countDocuments(),
            Order.find({}).select("total"),
            lastSixMonthOrdersPromise,
            Product.distinct("category"),
            User.countDocuments({gender:"Female"}),
            latestTransactionsPromise,
        ])

        // const productChangePercent = calculatePercentage(thisMonthProducts.length,lastMonthProducts.length)

        // const userChangePercent = calculatePercentage(thisMonthUsers.length,lastMonthUsers.length)

        // const orderChangePercent = calculatePercentage(thisMonthOrders.length,lastMonthOrders.length)

        const thisMonthRevenue =  thisMonthOrders.reduce((total, order) => total + (order.total || 0), 0);

        const lastMonthRevenue = lastMonthOrders.reduce(
            (total, order) => total + (order.total || 0), 0
        )


        const changePercent = {
            revenue: calculatePercentage(thisMonthRevenue,lastMonthRevenue),
            
            product: calculatePercentage(thisMonthProducts.length,lastMonthProducts.length),

            user: calculatePercentage(thisMonthUsers.length,lastMonthUsers.length),

            order: calculatePercentage(thisMonthOrders.length,lastMonthOrders.length)
        }

        const revenue = allOrders.reduce(
            (total, order) => total + (order.total || 0 ), 0 
            );
         const count = {
                revenue,
                product: productsCount,
                user: usersCount,
                order: allOrders.length,
            }

            //humne 0-5 tak ki 1 array bna li h jisme hum array k index pr us month me jitne order placed hue h ushe store krege.
            const orderMonthCounts = new Array(6).fill(0);
            //humne 0-5 tak ki 1 array bna li h jisme hum array k index pr us month me jitne order placed hue h uske revenue ko store krege.
            const orderMonthlyRevenue = new Array(6).fill(0);

            lastSixMonthOrders.forEach((order) => {
                const creationDate = order.createdAt;
                //hum order ki creation date ka month aur aaj ki date ka month ka difference nikale ge 
                const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

                //yadi vo difference 6 se kam hoga toh hum chart pr uska data show krege
                if(monthDiff < 6){
                    // orderMonthCounts array ka us month ka index 1 se bdha dege 
                    orderMonthCounts[6 - monthDiff - 1] += 1;
                    //us month ka total revenue array me us month k respectively store krva dege.
                    orderMonthlyRevenue[6 - monthDiff - 1] += order.total;
                }
            })

            //isme hum different categories me kitne product h vo calculate krege. hum ishe promise bnaye ge kyoki hum parallely products ko calculate krne chathe h sbhi categories k vajah 1-1 category k products k.
       
            // const categoriesCountPromise =  categories.map(category => Product.countDocuments({category}));
            // const categoriesCount = await Promise.all(categoriesCountPromise);
            // const categoryCount:Record<string,number>[] = [];

            // categories.forEach((category, i) => {
            //     categoryCount.push({
            //         [category]: Math.round((categoriesCount[i] / productsCount) * 100),
            //     })
            // })

            //hum ye bhi use kr skte h uper is line {const orderMonthCounts = new Array(6).fill(0);} se le kr nich tak ki jagh

            // const orderMonthCounts = getChartData({
            //     length: 6,
            //     today,
            //     docArr: lastSixMonthOrders,
            // })
            // const orderMonthlyRevenue = getChartData({
            //     length: 6,
            //     today,
            //     docArr: lastSixMonthOrders,
            //     property: "total",
            // })


            //hume upar vala code dusre routes me bhi chaiye tha isliye humne ushe features vali file m likh liya aur yha import kr liya
            const categoryCount= await getInventories({
                categories,
                productsCount,
            });


            const userRatio = {
                male: usersCount - femaleUsersCount,
                female: femaleUsersCount,
            };
            
            const modifiedLatestTransaction = latestTransaction.map(i => ({
                _id: i._id,
                discount: i.discount,
                amount: i.total,
                quantity: i.orderItems.length,
                status: i.status,
            }))

        stats = {
            categoryCount,
            // productChangePercent,
            // userChangePercent,
            // orderChangePercent
            changePercent,
            count,
            chart:{
                order: orderMonthCounts,
                revenue: orderMonthlyRevenue,
            },
            userRatio,
            latestTransaction: modifiedLatestTransaction,
        }

        myCache.set("admin-stats", JSON.stringify(stats));

    }

    return res.status(200).json({
        success: true,
        stats,
    })
})

export const getPieCharts = TryCatch(async(req, res, next) => {
    let charts;

    if(myCache.has("admin-pie-charts")){
        charts = JSON.parse(myCache.get("admin-pie-charts") as string);
    }

    else{

        const allOrderPromise = Order.find({}).select([
            "total",
            "discount",
            "subtotal",
            "tax",
            "shippingCharges",
        ])
        const [
            processingOrder,
            shippedOrder,
            deliveredOrder,
            categories,
            productsCount,
            productsOutOfStock,
            allOrders,
            allUsers,
            adminUsers,
            customerUsers,
        ] = await Promise.all([
            Order.countDocuments({status: "Processing"}),
            Order.countDocuments({status: "Shipped"}),
            Order.countDocuments({status: "Delivered"}),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({stock: 0}),
            allOrderPromise,
            User.find({}).select(["dob"]),
            User.countDocuments({role: "admin"}),
            User.countDocuments({role: "user"}),
        ])

        const orderFullfillment = {
            processing: processingOrder,
            shipped: shippedOrder,
            delivered: deliveredOrder,
        }

        const productCategories = await getInventories({
            categories,
            productsCount,
        })

        const stockAvailability = {
            inStock: productsCount - productsOutOfStock,
            outOfStock:  productsOutOfStock,
        }


        const grossIncome = allOrders.reduce(
            (prev, order) =>prev + (order.total || 0 ),
            0
        );
        const discount = allOrders.reduce(
            (prev, order) =>prev + (order.discount || 0 ),
            0
        );
        const productionCost = allOrders.reduce(
            (prev, order) =>prev + (order.shippingCharges || 0 ),
            0
        );
        const burnt = allOrders.reduce(
            (prev, order) =>prev + (order.tax || 0 ),
            0
        );
        const marketingCost = Math.round( grossIncome * (30 /100));
        const netMargin = grossIncome - discount - productionCost - burnt - marketingCost
        
        const revenueDistribution = {
            netMargin,
            discount,
            productionCost,
            burnt,
            marketingCost,
        };

        const usersAgeGroup = {
            teen: allUsers.filter(i => i.age < 20).length,
            adult: allUsers.filter(i => i.age >= 20 && i.age < 40).length,
            old: allUsers.filter(i => i.age >= 40).length,
        }

        const adminCustomer = {
            admin: adminUsers,
            customer: customerUsers,
        }

        charts = {
            orderFullfillment,
            productCategories,
            stockAvailability,
            revenueDistribution,
            usersAgeGroup,
            adminCustomer,
        }

        myCache.set("admin-pie-charts",JSON.stringify(charts));

    }
    return res.status(200).json({
        success: true,
        charts,
    })
})

export const getBarCharts = TryCatch(async(req, res, next) => {

    let charts;

    const key = "admin-bar-charts";

    if(myCache.has(key)){
        charts = JSON.parse(myCache.get(key) as string);
    }
    else{

        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setFullYear(sixMonthsAgo.getMonth() - 6);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getMonth() - 12);

        const lastSixMonthProductPromise = Product.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today,
            }
        }).select("createdAt");
        const lastSixMonthUsersPromise = User.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today,
            }
        }).select("createdAt");
        const lastTwelveMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: twelveMonthsAgo,
                $lte: today,
            }
        }).select("createdAt");

        const [products, users, orders] = await Promise.all([
           lastSixMonthProductPromise,
           lastSixMonthUsersPromise,
           lastTwelveMonthOrdersPromise,
        ])

        const productCounts = getChartData({length:6, today, docArr: products})
        const usersCounts = getChartData({length:6, today, docArr: users})
        const ordersCounts = getChartData({length:12, today, docArr: orders})

        charts = {
                users: usersCounts,
                products: productCounts,
                orders: ordersCounts,
        }

        myCache.set(key,JSON.stringify(charts));
    }

    return res.status(200).json({
        success: true,
        charts,
    })

})

export const getLineCharts = TryCatch(async(req, res, next) => {

        let charts;
        const key = "admin-line-charts";

        if(myCache.has(key)){
            charts = JSON.parse(myCache.get(key) as  string);
        }
        else{

            const today = new Date();

            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

                const baseQuery = {
                    createdAt: {
                        $gte: twelveMonthsAgo,
                        $lte: today,
                    }
                }

            const lastTwelveMonthProductssPromise = Product.find(
            //     {
            //     createdAt: {
            //         $gte: twelveMonthsAgo,
            //         $lte:today,
            //     }
            // }
            baseQuery
            ).select("createdAt");
            const lastTwelveMonthUsersPromise = User.find(
            //     {
            //     createdAt: {
            //         $gte: twelveMonthsAgo,
            //         $lte:today,
            //     }
            // }
            baseQuery
            ).select("createdAt")
            const lastTwelveMonthOrdersPromise = Order.find(
            //     {
            //     createdAt: {
            //         $gte: twelveMonthsAgo,
            //         $lte:today,
            //     }
            // }
            baseQuery
            ).select(["createdAt","discount","total"]);

            const [products, users, orders] = await Promise.all([
                lastTwelveMonthProductssPromise,
                lastTwelveMonthUsersPromise,lastTwelveMonthOrdersPromise,
            ])

            const productCounts = getChartData({length:12, today, docArr:products});
            const usersCount = getChartData({length: 12,today,docArr: users});
            const discount = getChartData({length: 12,today,docArr: orders, property: "discount"});
            const revenue = getChartData({length: 12,today,docArr: orders, property: "total"});

            charts = {
                users: usersCount,
                products: productCounts,
                discount,
                revenue,
            }

            myCache.set(key,JSON.stringify(charts));

          
        }
        return res.status(200).json({
            success:true,
            charts,
        })
})