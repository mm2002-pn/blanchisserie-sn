import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import Card from '@/components/ui/Card';
import ThemedText from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

// Mock planning data - scheduled collection days
const SCHEDULED_COLLECTIONS = [
    { dayOfWeek: 1, time: '09:00', type: 'regular' }, // Monday
    { dayOfWeek: 4, time: '14:00', type: 'regular' }, // Thursday
];

const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function PlanningScreen() {
    const colors = useThemeColors();
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        // Adjust for Monday start (0 = Sunday, 1 = Monday, etc.)
        return firstDay === 0 ? 6 : firstDay - 1;
    };

    const isCollectionDay = (date: Date) => {
        const dayOfWeek = date.getDay();
        // Adjust for Monday start
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        return SCHEDULED_COLLECTIONS.some(schedule => schedule.dayOfWeek === adjustedDay);
    };

    const getCollectionTime = (date: Date) => {
        const dayOfWeek = date.getDay();
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const schedule = SCHEDULED_COLLECTIONS.find(s => s.dayOfWeek === adjustedDay);
        return schedule?.time;
    };

    const isPastDate = (day: number) => {
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return checkDate < today;
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            days.push(
                <View key={`empty-${i}`} style={styles.dayCell} />
            );
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isCollection = isCollectionDay(date);
            const isPast = isPastDate(day);
            const isTodayDate = isToday(day);
            const collectionTime = getCollectionTime(date);

            days.push(
                <TouchableOpacity
                    key={day}
                    style={[
                        styles.dayCell,
                        isTodayDate && styles.todayCell,
                        isCollection && !isPast && {
                            backgroundColor: colors.hotelPrimary + '15',
                            borderColor: colors.hotelPrimary,
                            borderWidth: 2,
                        },
                        isCollection && isPast && {
                            backgroundColor: '#E5E7EB',
                        },
                    ]}
                    disabled={!isCollection || isPast}
                >
                    <Text
                        style={[
                            styles.dayNumber,
                            isTodayDate && { color: colors.hotelPrimary, fontWeight: 'bold' },
                            isPast && { color: '#9CA3AF' },
                            isCollection && !isPast && { color: colors.hotelPrimary },
                        ]}
                    >
                        {day}
                    </Text>
                    {isCollection && (
                        <Text style={styles.collectionDot}>
                            {isPast ? '✓' : '📦'}
                        </Text>
                    )}
                </TouchableOpacity>
            );
        }

        return days;
    };

    // Get next collection date
    const getNextCollection = () => {
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() + i);
            if (isCollectionDay(checkDate) && i > 0) {
                return {
                    date: checkDate,
                    time: getCollectionTime(checkDate),
                };
            }
        }
        return null;
    };

    const nextCollection = getNextCollection();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.content}
            >
            {/* Header */}
            <View style={styles.header}>
                <ThemedText variate="headline" color="textPrimary">
                    Planning Contractuel
                </ThemedText>
            </View>

            {/* Next Collection Card */}
            {nextCollection && (
                <Card style={[styles.nextCollectionCard, { backgroundColor: colors.hotelPrimary + '10' }]}>
                    <View style={styles.nextCollectionHeader}>
                        <Text style={styles.nextCollectionIcon}>📅</Text>
                        <View style={{ flex: 1 }}>
                            <ThemedText variate="subtitle2" color="textPrimary">
                                Prochaine collecte
                            </ThemedText>
                            <ThemedText variate="body2" color="textSecondary">
                                {nextCollection.date.toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </ThemedText>
                            <ThemedText variate="subtitle3" style={{ color: colors.hotelPrimary }}>
                                {nextCollection.time}
                            </ThemedText>
                        </View>
                    </View>
                </Card>
            )}

            {/* Schedule Info Card */}
            <Card>
                <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                    Horaires contractuels
                </ThemedText>
                {SCHEDULED_COLLECTIONS.map((schedule, index) => (
                    <View key={index} style={styles.scheduleRow}>
                        <View style={styles.scheduleDay}>
                            <Text style={styles.scheduleIcon}>📦</Text>
                            <ThemedText variate="body2" color="textPrimary">
                                {DAYS_SHORT[schedule.dayOfWeek]}
                            </ThemedText>
                        </View>
                        <View
                            style={[
                                styles.scheduleTime,
                                { backgroundColor: colors.hotelPrimary + '15' }
                            ]}
                        >
                            <ThemedText variate="body3" style={{ color: colors.hotelPrimary }}>
                                {schedule.time}
                            </ThemedText>
                        </View>
                    </View>
                ))}
                <View style={styles.scheduleNote}>
                    <Text style={styles.noteIcon}>ℹ️</Text>
                    <ThemedText variate="caption" color="textSecondary" style={{ flex: 1 }}>
                        Les collectes sont effectuées aux horaires indiqués. Préparez votre linge 30 minutes avant.
                    </ThemedText>
                </View>
            </Card>

            {/* Calendar */}
            <Card>
                <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
                        <Text style={styles.navButtonText}>←</Text>
                    </TouchableOpacity>
                    <ThemedText variate="subtitle1" color="textPrimary">
                        {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </ThemedText>
                    <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
                        <Text style={styles.navButtonText}>→</Text>
                    </TouchableOpacity>
                </View>

                {/* Day headers */}
                <View style={styles.daysHeader}>
                    {DAYS_SHORT.map(day => (
                        <View key={day} style={styles.dayHeaderCell}>
                            <ThemedText variate="caption" color="textSecondary">
                                {day}
                            </ThemedText>
                        </View>
                    ))}
                </View>

                {/* Calendar grid */}
                <View style={styles.calendarGrid}>
                    {renderCalendar()}
                </View>

                {/* Legend */}
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.hotelPrimary }]} />
                        <ThemedText variate="caption" color="textSecondary">
                            Jour de collecte
                        </ThemedText>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#E5E7EB' }]} />
                        <ThemedText variate="caption" color="textSecondary">
                            Collecte effectuée
                        </ThemedText>
                    </View>
                </View>
            </Card>

            {/* Help Card */}
            <Card style={{ backgroundColor: '#F3F4F6' }}>
                <ThemedText variate="subtitle2" color="textPrimary" style={styles.sectionTitle}>
                    Besoin de modifier votre planning?
                </ThemedText>
                <ThemedText variate="body3" color="textSecondary">
                    Contactez notre service client pour ajuster vos créneaux de collecte ou ajouter des collectes exceptionnelles.
                </ThemedText>
                <TouchableOpacity
                    style={[
                        styles.contactButton,
                        { backgroundColor: colors.hotelPrimary }
                    ]}
                    onPress={() => {
                        // Navigate to support
                    }}
                >
                    <Text style={styles.contactButtonText}>📞 Contacter le service client</Text>
                </TouchableOpacity>
            </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.padding.screen,
        paddingBottom: Spacing.xxxl,
    },
    header: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        marginBottom: Spacing.md,
    },
    nextCollectionCard: {
        marginBottom: Spacing.md,
    },
    nextCollectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    nextCollectionIcon: {
        fontSize: 40,
    },
    scheduleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    scheduleDay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    scheduleIcon: {
        fontSize: 20,
    },
    scheduleTime: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Spacing.borderRadius.md,
    },
    scheduleNote: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        padding: Spacing.md,
        borderRadius: Spacing.borderRadius.md,
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    noteIcon: {
        fontSize: 16,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    navButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Spacing.borderRadius.md,
        backgroundColor: '#F3F4F6',
    },
    navButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    daysHeader: {
        flexDirection: 'row',
        marginBottom: Spacing.sm,
    },
    dayHeaderCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.xs,
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Spacing.borderRadius.sm,
        marginBottom: Spacing.xs,
        position: 'relative',
    },
    todayCell: {
        backgroundColor: '#FEF3C7',
    },
    dayNumber: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    collectionDot: {
        position: 'absolute',
        bottom: 2,
        fontSize: 12,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.lg,
        marginTop: Spacing.lg,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    contactButton: {
        marginTop: Spacing.md,
        paddingVertical: Spacing.md,
        borderRadius: Spacing.borderRadius.md,
        alignItems: 'center',
    },
    contactButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
});
